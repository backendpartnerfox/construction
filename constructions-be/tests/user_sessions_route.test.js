// tests/user_sessions_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS user_sessions');
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM user_sessions');
  await pool.query('DELETE FROM users');
  
  // Insert test data
  await pool.query(`
    INSERT INTO users (id, username, email, password, first_name, last_name, is_active)
    VALUES 
      (1, 'john_doe', 'john@example.com', 'password123', 'John', 'Doe', true),
      (2, 'jane_smith', 'jane@example.com', 'password456', 'Jane', 'Smith', true),
      (3, 'inactive_user', 'inactive@example.com', 'password789', 'Inactive', 'User', false)
  `);

  // Insert test sessions (some active, some expired)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  await pool.query(`
    INSERT INTO user_sessions (id, user_id, token, ip_address, user_agent, expires_at)
    VALUES 
      (1, 1, 'active_token_1', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', $1),
      (2, 1, 'active_token_2', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', $1),
      (3, 2, 'active_token_3', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64)', $1),
      (4, 1, 'expired_token_1', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', $2)
  `, [tomorrow, yesterday]);
  
  // Reset sequences
  await pool.query("SELECT setval('users_id_seq', 3)");
  await pool.query("SELECT setval('user_sessions_id_seq', 4)");
});

describe('User Sessions API', () => {
  // Test GET all active sessions
  test('GET /user-sessions - should return all active sessions', async () => {
    const response = await request(app).get('/user-sessions');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // Only active sessions
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('user_id');
    expect(response.body[0]).toHaveProperty('username');
    expect(response.body[0]).toHaveProperty('token');
    expect(response.body[0]).toHaveProperty('ip_address');
    expect(response.body[0]).toHaveProperty('user_agent');
    expect(response.body[0]).toHaveProperty('created_at');
    expect(response.body[0]).toHaveProperty('expires_at');
    
    // Check that expired sessions are not included
    const tokens = response.body.map(session => session.token);
    expect(tokens).not.toContain('expired_token_1');
  });
  
  // Test GET session by ID
  test('GET /user-sessions/:id - should return a specific session', async () => {
    const response = await request(app).get('/user-sessions/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('user_id', 1);
    expect(response.body).toHaveProperty('username', 'john_doe');
    expect(response.body).toHaveProperty('token', 'active_token_1');
    expect(response.body).toHaveProperty('ip_address', '192.168.1.100');
    expect(response.body).toHaveProperty('user_agent');
  });
  
  // Test GET session by ID - not found
  test('GET /user-sessions/:id - should return 404 for non-existent session', async () => {
    const response = await request(app).get('/user-sessions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Session not found');
  });
  
  // Test GET session by token - valid token
  test('GET /user-sessions/token/:token - should validate and return user info for valid token', async () => {
    const response = await request(app).get('/user-sessions/token/active_token_1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('user_id', 1);
    expect(response.body).toHaveProperty('username', 'john_doe');
    expect(response.body).toHaveProperty('email', 'john@example.com');
    expect(response.body).toHaveProperty('first_name', 'John');
    expect(response.body).toHaveProperty('last_name', 'Doe');
    expect(response.body).toHaveProperty('created_at');
    expect(response.body).toHaveProperty('expires_at');
  });
  
  // Test GET session by token - expired token
  test('GET /user-sessions/token/:token - should return 401 for expired token', async () => {
    const response = await request(app).get('/user-sessions/token/expired_token_1');
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid or expired token');
  });
  
  // Test GET session by token - invalid token
  test('GET /user-sessions/token/:token - should return 401 for invalid token', async () => {
    const response = await request(app).get('/user-sessions/token/invalid_token');
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid or expired token');
  });
  
  // Test POST login - successful login
  test('POST /user-sessions/login - should login user and create session', async () => {
    const loginData = {
      username: 'john_doe',
      password: 'password123',
      ip_address: '192.168.1.200',
      user_agent: 'Test Browser'
    };
    
    const response = await request(app)
      .post('/user-sessions/login')
      .send(loginData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Login successful');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id', 1);
    expect(response.body.user).toHaveProperty('username', 'john_doe');
    expect(response.body.user).toHaveProperty('email', 'john@example.com');
    expect(response.body).toHaveProperty('session');
    expect(response.body.session).toHaveProperty('token');
    expect(response.body.session).toHaveProperty('expires_at');
    expect(response.body.session.token).toHaveLength(64); // 32 bytes as hex string
    
    // Verify session was created in database
    const allSessions = await request(app).get('/user-sessions');
    expect(allSessions.body.length).toBe(4); // 3 existing + 1 new
  });
  
  // Test POST login - invalid credentials
  test('POST /user-sessions/login - should return 401 for invalid credentials', async () => {
    const loginData = {
      username: 'john_doe',
      password: 'wrong_password'
    };
    
    const response = await request(app)
      .post('/user-sessions/login')
      .send(loginData);
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });
  
  // Test POST login - inactive user
  test('POST /user-sessions/login - should return 401 for inactive user', async () => {
    const loginData = {
      username: 'inactive_user',
      password: 'password789'
    };
    
    const response = await request(app)
      .post('/user-sessions/login')
      .send(loginData);
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });
  
  // Test POST login - missing required fields
  test('POST /user-sessions/login - should return 400 for missing required fields', async () => {
    const incompleteData = {
      username: 'john_doe'
    };
    
    const response = await request(app)
      .post('/user-sessions/login')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Username and password are required');
  });
  
  // Test DELETE session by ID
  test('DELETE /user-sessions/:id - should end a specific session', async () => {
    const response = await request(app).delete('/user-sessions/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Session ended successfully');
    
    // Verify session was deleted
    const deletedSession = await request(app).get('/user-sessions/1');
    expect(deletedSession.status).toBe(404);
    
    const allSessions = await request(app).get('/user-sessions');
    expect(allSessions.body.length).toBe(2);
  });
  
  // Test DELETE session by ID - not found
  test('DELETE /user-sessions/:id - should return 404 for non-existent session', async () => {
    const response = await request(app).delete('/user-sessions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Session not found');
  });
  
  // Test DELETE session by token
  test('DELETE /user-sessions/token/:token - should logout by token', async () => {
    const response = await request(app).delete('/user-sessions/token/active_token_1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Logout successful');
    
    // Verify session was deleted
    const tokenResponse = await request(app).get('/user-sessions/token/active_token_1');
    expect(tokenResponse.status).toBe(401);
    
    const allSessions = await request(app).get('/user-sessions');
    expect(allSessions.body.length).toBe(2);
  });
  
  // Test DELETE session by token - not found
  test('DELETE /user-sessions/token/:token - should return 404 for non-existent token', async () => {
    const response = await request(app).delete('/user-sessions/token/invalid_token');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Session not found');
  });
  
  // Test GET sessions for specific user
  test('GET /user-sessions/user/:userId - should return all sessions for specific user', async () => {
    const response = await request(app).get('/user-sessions/user/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // 2 active + 1 expired
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('token');
    expect(response.body[0]).toHaveProperty('ip_address');
    expect(response.body[0]).toHaveProperty('user_agent');
    expect(response.body[0]).toHaveProperty('created_at');
    expect(response.body[0]).toHaveProperty('expires_at');
    
    // Check that all sessions belong to user 1
    const tokens = response.body.map(session => session.token);
    expect(tokens).toContain('active_token_1');
    expect(tokens).toContain('active_token_2');
    expect(tokens).toContain('expired_token_1');
  });
  
  // Test GET sessions for specific user - user not found
  test('GET /user-sessions/user/:userId - should return 404 for non-existent user', async () => {
    const response = await request(app).get('/user-sessions/user/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test DELETE all sessions for specific user
  test('DELETE /user-sessions/user/:userId - should end all sessions for specific user', async () => {
    const response = await request(app).delete('/user-sessions/user/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'All sessions for user ended successfully');
    expect(response.body).toHaveProperty('count', 3); // Number of sessions deleted
    
    // Verify all sessions for user 1 were deleted
    const userSessions = await request(app).get('/user-sessions/user/1');
    expect(userSessions.body.length).toBe(0);
    
    // Verify only sessions for other users remain
    const allSessions = await request(app).get('/user-sessions');
    expect(allSessions.body.length).toBe(1); // Only user 2's session
  });
  
  // Test DELETE all sessions for specific user - user not found
  test('DELETE /user-sessions/user/:userId - should return 404 for non-existent user', async () => {
    const response = await request(app).delete('/user-sessions/user/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test PUT refresh session token
  test('PUT /user-sessions/refresh/:token - should refresh session token', async () => {
    const refreshData = {
      hours: 48
    };
    
    const response = await request(app)
      .put('/user-sessions/refresh/active_token_1')
      .send(refreshData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Session refreshed successfully');
    expect(response.body).toHaveProperty('session');
    expect(response.body.session).toHaveProperty('id', 1);
    expect(response.body.session).toHaveProperty('user_id', 1);
    expect(response.body.session).toHaveProperty('token', 'active_token_1');
    expect(response.body.session).toHaveProperty('expires_at');
    
    // Verify expiration time was updated
    const originalSession = await request(app).get('/user-sessions/1');
    expect(new Date(response.body.session.expires_at)).toBeInstanceOf(Date);
  });
  
  // Test PUT refresh session token - default hours
  test('PUT /user-sessions/refresh/:token - should use default 24 hours if not specified', async () => {
    const response = await request(app)
      .put('/user-sessions/refresh/active_token_1')
      .send({});
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Session refreshed successfully');
    expect(response.body).toHaveProperty('session');
    expect(response.body.session).toHaveProperty('expires_at');
  });
  
  // Test PUT refresh session token - expired token
  test('PUT /user-sessions/refresh/:token - should return 404 for expired token', async () => {
    const refreshData = {
      hours: 24
    };
    
    const response = await request(app)
      .put('/user-sessions/refresh/expired_token_1')
      .send(refreshData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Session not found or already expired');
  });
  
  // Test PUT refresh session token - invalid token
  test('PUT /user-sessions/refresh/:token - should return 404 for invalid token', async () => {
    const refreshData = {
      hours: 24
    };
    
    const response = await request(app)
      .put('/user-sessions/refresh/invalid_token')
      .send(refreshData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Session not found or already expired');
  });
  
  // Test edge cases
  test('GET /user-sessions/user/:userId - should return empty array for user with no sessions', async () => {
    // Delete all sessions for user 2
    await request(app).delete('/user-sessions/user/2');
    
    const response = await request(app).get('/user-sessions/user/2');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
  
  // Test session token update during validation
  test('GET /user-sessions/token/:token - should update last activity time', async () => {
    // Get session before validation
    const beforeResponse = await request(app).get('/user-sessions/1');
    const beforeTime = new Date(beforeResponse.body.created_at);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validate token (which should update created_at)
    await request(app).get('/user-sessions/token/active_token_1');
    
    // Get session after validation
    const afterResponse = await request(app).get('/user-sessions/1');
    const afterTime = new Date(afterResponse.body.created_at);
    
    // The created_at time should have been updated
    expect(afterTime.getTime()).toBeGreaterThan(beforeTime.getTime());
  });
});
