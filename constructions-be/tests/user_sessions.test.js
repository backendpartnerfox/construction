// tests/user_sessions.test.js
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
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      password VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT true
    );
    
    CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token VARCHAR(64) NOT NULL UNIQUE,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    );
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
    INSERT INTO users (id, username, email, first_name, last_name, password, is_active)
    VALUES 
      (1, 'testuser1', 'test1@example.com', 'Test', 'User1', 'password123', true),
      (2, 'testuser2', 'test2@example.com', 'Test', 'User2', 'password123', true),
      (3, 'inactiveuser', 'inactive@example.com', 'Inactive', 'User', 'password123', false)
  `);
  
  // Create test sessions
  const futureDate = new Date();
  futureDate.setHours(futureDate.getHours() + 24);
  
  const pastDate = new Date();
  pastDate.setHours(pastDate.getHours() - 1);
  
  await pool.query(`
    INSERT INTO user_sessions (id, user_id, token, ip_address, user_agent, created_at, expires_at)
    VALUES 
      (1, 1, 'valid_token_123', '127.0.0.1', 'Test Agent', CURRENT_TIMESTAMP, $1),
      (2, 2, 'valid_token_456', '127.0.0.1', 'Test Agent', CURRENT_TIMESTAMP, $2),
      (3, 1, 'expired_token_789', '127.0.0.1', 'Test Agent', CURRENT_TIMESTAMP, $3)
  `, [futureDate, futureDate, pastDate]);
  
  // Reset sequences
  await pool.query("SELECT setval('users_id_seq', 3)");
  await pool.query("SELECT setval('user_sessions_id_seq', 3)");
});

describe('UserSessions API', () => {
  // Test GET all sessions
  test('GET /user-sessions - should return all active sessions', async () => {
    const response = await request(app).get('/user-sessions');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); // Only active sessions
    expect(response.body[0]).toHaveProperty('token');
    expect(response.body[0]).toHaveProperty('user_id');
    expect(response.body[0]).toHaveProperty('username');
  });
  
  // Test GET session by ID
  test('GET /user-sessions/:id - should return a specific session', async () => {
    const response = await request(app).get('/user-sessions/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('user_id', 1);
    expect(response.body).toHaveProperty('token', 'valid_token_123');
    expect(response.body).toHaveProperty('username', 'testuser1');
  });
  
  // Test GET session by ID - not found
  test('GET /user-sessions/:id - should return 404 for non-existent session', async () => {
    const response = await request(app).get('/user-sessions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Session not found');
  });
  
  // Test GET session by token - valid
  test('GET /user-sessions/token/:token - should validate a valid token', async () => {
    const response = await request(app).get('/user-sessions/token/valid_token_123');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user_id', 1);
    expect(response.body).toHaveProperty('username', 'testuser1');
    expect(response.body).toHaveProperty('email', 'test1@example.com');
  });
  
  // Test GET session by token - expired token
  test('GET /user-sessions/token/:token - should return 401 for expired token', async () => {
    const response = await request(app).get('/user-sessions/token/expired_token_789');
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid or expired token');
  });
  
  // Test GET session by token - invalid token
  test('GET /user-sessions/token/:token - should return 401 for invalid token', async () => {
    const response = await request(app).get('/user-sessions/token/nonexistent_token');
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid or expired token');
  });
  
  // Test POST login - successful
  test('POST /user-sessions/login - should login successfully', async () => {
    const loginData = {
      username: 'testuser1',
      password: 'password123',
      ip_address: '192.168.1.1',
      user_agent: 'Test Browser'
    };
    
    const response = await request(app)
      .post('/user-sessions/login')
      .send(loginData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Login successful');
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('session');
    expect(response.body.user).toHaveProperty('username', 'testuser1');
    expect(response.body.session).toHaveProperty('token');
    
    // Verify session was created
    const token = response.body.session.token;
    const sessionCheck = await request(app).get(`/user-sessions/token/${token}`);
    expect(sessionCheck.status).toBe(200);
  });
  
  // Test POST login - invalid credentials
  test('POST /user-sessions/login - should return 401 for invalid credentials', async () => {
    const loginData = {
      username: 'testuser1',
      password: 'wrong_password',
      ip_address: '192.168.1.1',
      user_agent: 'Test Browser'
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
      username: 'inactiveuser',
      password: 'password123',
      ip_address: '192.168.1.1',
      user_agent: 'Test Browser'
    };
    
    const response = await request(app)
      .post('/user-sessions/login')
      .send(loginData);
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });
  
  // Test DELETE session by ID
  test('DELETE /user-sessions/:id - should end a session', async () => {
    const response = await request(app).delete('/user-sessions/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Session ended successfully');
    
    // Verify session was deleted
    const sessionCheck = await request(app).get('/user-sessions/1');
    expect(sessionCheck.status).toBe(404);
  });
  
  // Test DELETE session by ID - not found
  test('DELETE /user-sessions/:id - should return 404 for non-existent session', async () => {
    const response = await request(app).delete('/user-sessions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Session not found');
  });
  
  // Test DELETE session by token
  test('DELETE /user-sessions/token/:token - should logout by token', async () => {
    const response = await request(app).delete('/user-sessions/token/valid_token_123');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Logout successful');
    
    // Verify token is invalidated
    const tokenCheck = await request(app).get('/user-sessions/token/valid_token_123');
    expect(tokenCheck.status).toBe(401);
  });
  
  // Test GET sessions by user ID
  test('GET /user-sessions/user/:userId - should return all sessions for a user', async () => {
    const response = await request(app).get('/user-sessions/user/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); // Includes both active and expired sessions
    expect(response.body[0]).toHaveProperty('token');
  });
  
  // Test GET sessions by user ID - user not found
  test('GET /user-sessions/user/:userId - should return 404 for non-existent user', async () => {
    const response = await request(app).get('/user-sessions/user/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test DELETE all sessions for a user
  test('DELETE /user-sessions/user/:userId - should end all sessions for a user', async () => {
    const response = await request(app).delete('/user-sessions/user/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'All sessions for user ended successfully');
    expect(response.body).toHaveProperty('count', 2);
    
    // Verify sessions were deleted
    const sessionsCheck = await request(app).get('/user-sessions/user/1');
    expect(sessionsCheck.body.length).toBe(0);
  });
  
  // Test PUT refresh session token
  test('PUT /user-sessions/refresh/:token - should extend session expiration', async () => {
    const refreshData = {
      hours: 48
    };
    
    const response = await request(app)
      .put('/user-sessions/refresh/valid_token_123')
      .send(refreshData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Session refreshed successfully');
    expect(response.body).toHaveProperty('session');
    expect(response.body.session).toHaveProperty('token', 'valid_token_123');
    
    // The expiration date should be updated (can't test exact value easily)
    expect(response.body.session).toHaveProperty('expires_at');
  });
  
  // Test PUT refresh token - expired token
  test('PUT /user-sessions/refresh/:token - should return 404 for expired token', async () => {
    const refreshData = {
      hours: 24
    };
    
    const response = await request(app)
      .put('/user-sessions/refresh/expired_token_789')
      .send(refreshData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Session not found or already expired');
  });
});
