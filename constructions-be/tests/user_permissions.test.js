// tests/user_permissions.test.js
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
    
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT
    );
    
    CREATE TABLE IF NOT EXISTS user_permissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      permission_id INTEGER NOT NULL REFERENCES permissions(id),
      UNIQUE(user_id, permission_id)
    );
    
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT
    );
    
    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      role_id INTEGER NOT NULL REFERENCES roles(id),
      permission_id INTEGER NOT NULL REFERENCES permissions(id),
      UNIQUE(role_id, permission_id)
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
  await pool.query('DROP TABLE IF EXISTS user_permissions');
  await pool.query('DROP TABLE IF EXISTS role_permissions');
  await pool.query('DROP TABLE IF EXISTS user_roles');
  await pool.query('DROP TABLE IF EXISTS permissions');
  await pool.query('DROP TABLE IF EXISTS roles');
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM user_permissions');
  await pool.query('DELETE FROM role_permissions');
  await pool.query('DELETE FROM user_roles');
  await pool.query('DELETE FROM permissions');
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
    INSERT INTO permissions (id, name, description)
    VALUES 
      (1, 'view_projects', 'Permission to view projects'),
      (2, 'edit_projects', 'Permission to edit projects')
  `);
  
  await pool.query(`
    INSERT INTO roles (id, name, description)
    VALUES 
      (1, 'admin', 'Administrator role'),
      (2, 'user', 'Regular user role')
  `);
  
  await pool.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES 
      (1, 1),  -- Admin has view_projects
      (1, 2),  -- Admin has edit_projects
      (2, 1)   -- User has view_projects
  `);
  
  await pool.query(`
    INSERT INTO user_permissions (user_id, permission_id)
    VALUES (1, 1)  -- testuser1 has view_projects
  `);
  
  await pool.query(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES (2, 2)  -- testuser2 has user role
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('users_id_seq', 2)");
  await pool.query("SELECT setval('permissions_id_seq', 2)");
  await pool.query("SELECT setval('roles_id_seq', 2)");
  await pool.query("SELECT setval('user_permissions_id_seq', 1)");
  await pool.query("SELECT setval('role_permissions_id_seq', 3)");
  await pool.query("SELECT setval('user_roles_id_seq', 1)");
});

describe('UserPermissions API', () => {
  // Test GET all user-permissions
  test('GET /user-permissions - should return all user permission assignments', async () => {
    const response = await request(app).get('/user-permissions');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('user_id', 1);
    expect(response.body[0]).toHaveProperty('permission_id', 1);
    expect(response.body[0]).toHaveProperty('username', 'testuser1');
    expect(response.body[0]).toHaveProperty('permission_name', 'view_projects');
  });
  
  // Test GET specific user-permission
  test('GET /user-permissions/:userId/:permissionId - should check if a user has a specific permission', async () => {
    const response = await request(app).get('/user-permissions/1/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user_id', 1);
    expect(response.body).toHaveProperty('permission_id', 1);
    expect(response.body).toHaveProperty('username', 'testuser1');
    expect(response.body).toHaveProperty('permission_name', 'view_projects');
  });
  
  // Test GET specific user-permission - not found
  test('GET /user-permissions/:userId/:permissionId - should return 404 for non-existent assignment', async () => {
    const response = await request(app).get('/user-permissions/1/2');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission assignment not found');
  });
  
  // Test POST assign permission to user
  test('POST /user-permissions - should assign a permission to a user', async () => {
    const permissionAssignment = {
      user_id: 1,
      permission_id: 2
    };
    
    const response = await request(app)
      .post('/user-permissions')
      .send(permissionAssignment);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Permission assigned successfully');
    expect(response.body).toHaveProperty('user_id', 1);
    expect(response.body).toHaveProperty('permission_id', 2);
    expect(response.body).toHaveProperty('permission_name', 'edit_projects');
    
    // Verify assignment was created
    const checkResponse = await request(app).get('/user-permissions/1/2');
    expect(checkResponse.status).toBe(200);
  });
  
  // Test POST user-permission - missing fields
  test('POST /user-permissions - should return 400 for missing fields', async () => {
    const incompleteAssignment = {
      user_id: 1
      // Missing permission_id
    };
    
    const response = await request(app)
      .post('/user-permissions')
      .send(incompleteAssignment);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'User ID and permission ID are required');
  });
  
  // Test DELETE remove permission from user
  test('DELETE /user-permissions/:userId/:permissionId - should remove a permission from a user', async () => {
    const response = await request(app).delete('/user-permissions/1/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Permission removed from user successfully');
    
    // Verify assignment was removed
    const checkResponse = await request(app).get('/user-permissions/1/1');
    expect(checkResponse.status).toBe(404);
  });
  
  // Test DELETE user-permission - not found
  test('DELETE /user-permissions/:userId/:permissionId - should return 404 for non-existent assignment', async () => {
    const response = await request(app).delete('/user-permissions/1/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission assignment not found');
  });
  
  // Test GET permissions by user ID
  test('GET /user-permissions/user/:userId - should return all permissions for a user', async () => {
    const response = await request(app).get('/user-permissions/user/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('id', 1);
    expect(response.body[0]).toHaveProperty('name', 'view_projects');
  });
  
  // Test GET permissions by user ID - not found
  test('GET /user-permissions/user/:userId - should return 404 for non-existent user', async () => {
    const response = await request(app).get('/user-permissions/user/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test GET users by permission ID
  test('GET /user-permissions/permission/:permissionId - should return all users with a permission', async () => {
    const response = await request(app).get('/user-permissions/permission/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('id', 1);
    expect(response.body[0]).toHaveProperty('username', 'testuser1');
  });
  
  // Test GET users by permission ID - not found
  test('GET /user-permissions/permission/:permissionId - should return 404 for non-existent permission', async () => {
    const response = await request(app).get('/user-permissions/permission/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission not found');
  });
  
  // Test POST bulk assign permissions to user
  test('POST /user-permissions/user/:userId/bulkAssign - should assign multiple permissions to a user', async () => {
    const bulkAssignment = {
      permission_ids: [1, 2]
    };
    
    const response = await request(app)
      .post('/user-permissions/user/2/bulkAssign')
      .send(bulkAssignment);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Permissions assigned successfully');
    expect(Array.isArray(response.body.assigned_permissions)).toBeTruthy();
    expect(response.body.assigned_permissions.length).toBe(2);
    
    // Verify assignments were created
    const checkResponse = await request(app).get('/user-permissions/user/2');
    expect(checkResponse.body.length).toBe(2);
  });
  
  // Test POST check permission (direct)
  test('POST /user-permissions/check - should verify a user has a permission directly', async () => {
    const checkData = {
      user_id: 1,
      permission_name: 'view_projects'
    };
    
    const response = await request(app)
      .post('/user-permissions/check')
      .send(checkData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('has_permission', true);
    expect(response.body).toHaveProperty('source', 'direct');
  });
  
  // Test POST check permission (via role)
  test('POST /user-permissions/check - should verify a user has a permission via role', async () => {
    const checkData = {
      user_id: 2,
      permission_name: 'view_projects'
    };
    
    const response = await request(app)
      .post('/user-permissions/check')
      .send(checkData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('has_permission', true);
    expect(response.body).toHaveProperty('source', 'role');
  });
  
  // Test POST check permission (no permission)
  test('POST /user-permissions/check - should verify a user does not have a permission', async () => {
    const checkData = {
      user_id: 2,
      permission_name: 'edit_projects'
    };
    
    const response = await request(app)
      .post('/user-permissions/check')
      .send(checkData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('has_permission', false);
  });
});
