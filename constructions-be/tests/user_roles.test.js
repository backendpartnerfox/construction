// tests/user_roles.test.js
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
      is_active BOOLEAN DEFAULT true
    );
    
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT
    );
    
    CREATE TABLE IF NOT EXISTS user_roles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      role_id INTEGER NOT NULL REFERENCES roles(id),
      UNIQUE(user_id, role_id)
    );
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS user_roles');
  await pool.query('DROP TABLE IF EXISTS roles');
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM user_roles');
  await pool.query('DELETE FROM roles');
  await pool.query('DELETE FROM users');
  
  // Insert test data
  await pool.query(`
    INSERT INTO users (id, username, email, first_name, last_name, is_active)
    VALUES 
      (1, 'testuser1', 'test1@example.com', 'Test', 'User1', true),
      (2, 'testuser2', 'test2@example.com', 'Test', 'User2', true)
  `);
  
  await pool.query(`
    INSERT INTO roles (id, name, description)
    VALUES 
      (1, 'admin', 'Administrator role'),
      (2, 'manager', 'Manager role')
  `);
  
  await pool.query(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES (1, 1)  -- testuser1 has admin role
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('users_id_seq', 2)");
  await pool.query("SELECT setval('roles_id_seq', 2)");
  await pool.query("SELECT setval('user_roles_id_seq', 1)");
});

describe('UserRoles API', () => {
  // Test GET all user-roles
  test('GET /user-roles - should return all user role assignments', async () => {
    const response = await request(app).get('/user-roles');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('user_id', 1);
    expect(response.body[0]).toHaveProperty('role_id', 1);
    expect(response.body[0]).toHaveProperty('username', 'testuser1');
    expect(response.body[0]).toHaveProperty('role_name', 'admin');
  });
  
  // Test GET specific user-role
  test('GET /user-roles/:userId/:roleId - should check if a user has a specific role', async () => {
    const response = await request(app).get('/user-roles/1/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user_id', 1);
    expect(response.body).toHaveProperty('role_id', 1);
    expect(response.body).toHaveProperty('username', 'testuser1');
    expect(response.body).toHaveProperty('role_name', 'admin');
  });
  
  // Test GET specific user-role - not found
  test('GET /user-roles/:userId/:roleId - should return 404 for non-existent assignment', async () => {
    const response = await request(app).get('/user-roles/1/2');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Role assignment not found');
  });
  
  // Test POST assign role to user
  test('POST /user-roles - should assign a role to a user', async () => {
    const roleAssignment = {
      user_id: 2,
      role_id: 2
    };
    
    const response = await request(app)
      .post('/user-roles')
      .send(roleAssignment);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Role assigned successfully');
    expect(response.body).toHaveProperty('user_id', 2);
    expect(response.body).toHaveProperty('role_id', 2);
    expect(response.body).toHaveProperty('username', 'testuser2');
    expect(response.body).toHaveProperty('role_name', 'manager');
    
    // Verify assignment was created
    const checkResponse = await request(app).get('/user-roles/2/2');
    expect(checkResponse.status).toBe(200);
  });
  
  // Test POST user-role - missing fields
  test('POST /user-roles - should return 400 for missing fields', async () => {
    const incompleteAssignment = {
      user_id: 1
      // Missing role_id
    };
    
    const response = await request(app)
      .post('/user-roles')
      .send(incompleteAssignment);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'User ID and role ID are required');
  });
  
  // Test POST user-role - user not found
  test('POST /user-roles - should return 404 for non-existent user', async () => {
    const roleAssignment = {
      user_id: 999,
      role_id: 1
    };
    
    const response = await request(app)
      .post('/user-roles')
      .send(roleAssignment);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test POST user-role - role not found
  test('POST /user-roles - should return 404 for non-existent role', async () => {
    const roleAssignment = {
      user_id: 1,
      role_id: 999
    };
    
    const response = await request(app)
      .post('/user-roles')
      .send(roleAssignment);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Role not found');
  });
  
  // Test DELETE remove role from user
  test('DELETE /user-roles/:userId/:roleId - should remove a role from a user', async () => {
    const response = await request(app).delete('/user-roles/1/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Role removed from user successfully');
    
    // Verify assignment was removed
    const checkResponse = await request(app).get('/user-roles/1/1');
    expect(checkResponse.status).toBe(404);
  });
  
  // Test DELETE user-role - not found
  test('DELETE /user-roles/:userId/:roleId - should return 404 for non-existent assignment', async () => {
    const response = await request(app).delete('/user-roles/1/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Role assignment not found');
  });
  
  // Test GET roles by user ID
  test('GET /user-roles/user/:userId - should return all roles for a user', async () => {
    const response = await request(app).get('/user-roles/user/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('id', 1);
    expect(response.body[0]).toHaveProperty('name', 'admin');
  });
  
  // Test GET roles by user ID - not found
  test('GET /user-roles/user/:userId - should return 404 for non-existent user', async () => {
    const response = await request(app).get('/user-roles/user/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test GET users by role ID
  test('GET /user-roles/role/:roleId - should return all users with a role', async () => {
    const response = await request(app).get('/user-roles/role/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('id', 1);
    expect(response.body[0]).toHaveProperty('username', 'testuser1');
  });
  
  // Test GET users by role ID - not found
  test('GET /user-roles/role/:roleId - should return 404 for non-existent role', async () => {
    const response = await request(app).get('/user-roles/role/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Role not found');
  });
  
  // Test POST bulk assign roles to user
  test('POST /user-roles/user/:userId/bulkAssign - should assign multiple roles to a user', async () => {
    const bulkAssignment = {
      role_ids: [1, 2]
    };
    
    const response = await request(app)
      .post('/user-roles/user/2/bulkAssign')
      .send(bulkAssignment);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Roles assigned successfully');
    expect(Array.isArray(response.body.assigned_roles)).toBeTruthy();
    expect(response.body.assigned_roles.length).toBe(2);
    
    // Verify assignments were created
    const checkResponse = await request(app).get('/user-roles/user/2');
    expect(checkResponse.body.length).toBe(2);
  });
  
  // Test POST bulk assign - user not found
  test('POST /user-roles/user/:userId/bulkAssign - should return 404 for non-existent user', async () => {
    const bulkAssignment = {
      role_ids: [1, 2]
    };
    
    const response = await request(app)
      .post('/user-roles/user/999/bulkAssign')
      .send(bulkAssignment);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test POST bulk assign - invalid data
  test('POST /user-roles/user/:userId/bulkAssign - should return 400 for invalid data', async () => {
    const invalidData = {
      // Missing role_ids array
    };
    
    const response = await request(app)
      .post('/user-roles/user/1/bulkAssign')
      .send(invalidData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Role IDs array is required');
  });
});
