// tests/user_permissions_route.test.js
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
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      user_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, permission_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS role_permissions');
  await pool.query('DROP TABLE IF EXISTS user_roles');
  await pool.query('DROP TABLE IF EXISTS user_permissions');
  await pool.query('DROP TABLE IF EXISTS roles');
  await pool.query('DROP TABLE IF EXISTS permissions');
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM role_permissions');
  await pool.query('DELETE FROM user_roles');
  await pool.query('DELETE FROM user_permissions');
  await pool.query('DELETE FROM roles');
  await pool.query('DELETE FROM permissions');
  await pool.query('DELETE FROM users');
  
  // Insert test data
  await pool.query(`
    INSERT INTO users (id, username, email, first_name, last_name, is_active)
    VALUES 
      (1, 'john_doe', 'john@example.com', 'John', 'Doe', true),
      (2, 'jane_smith', 'jane@example.com', 'Jane', 'Smith', true),
      (3, 'bob_wilson', 'bob@example.com', 'Bob', 'Wilson', false)
  `);

  await pool.query(`
    INSERT INTO permissions (id, name, description)
    VALUES 
      (1, 'create_projects', 'Can create new projects'),
      (2, 'edit_projects', 'Can edit existing projects'),
      (3, 'delete_projects', 'Can delete projects'),
      (4, 'view_reports', 'Can view system reports'),
      (5, 'manage_users', 'Can manage user accounts')
  `);

  await pool.query(`
    INSERT INTO roles (id, name, description)
    VALUES 
      (1, 'Project Manager', 'Manages projects'),
      (2, 'Admin', 'System administrator')
  `);
  
  await pool.query(`
    INSERT INTO user_permissions (user_id, permission_id)
    VALUES 
      (1, 1),
      (1, 2),
      (2, 4),
      (3, 1)
  `);

  await pool.query(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES 
      (1, 1),
      (2, 2)
  `);

  await pool.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES 
      (1, 1),
      (1, 2),
      (2, 5)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('users_id_seq', 3)");
  await pool.query("SELECT setval('permissions_id_seq', 5)");
  await pool.query("SELECT setval('roles_id_seq', 2)");
});

describe('User Permissions API', () => {
  // Test GET all user-permission assignments
  test('GET /user-permissions - should return all user permission assignments', async () => {
    const response = await request(app).get('/user-permissions');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('user_id');
    expect(response.body[0]).toHaveProperty('permission_id');
    expect(response.body[0]).toHaveProperty('username');
    expect(response.body[0]).toHaveProperty('permission_name');
    
    // Check specific assignment
    const johnCreatePermission = response.body.find(
      assignment => assignment.username === 'john_doe' && assignment.permission_name === 'create_projects'
    );
    expect(johnCreatePermission).toBeDefined();
    expect(johnCreatePermission.user_id).toBe(1);
    expect(johnCreatePermission.permission_id).toBe(1);
  });
  
  // Test GET specific user-permission assignment
  test('GET /user-permissions/:userId/:permissionId - should return specific permission assignment', async () => {
    const response = await request(app).get('/user-permissions/1/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user_id', 1);
    expect(response.body).toHaveProperty('permission_id', 1);
    expect(response.body).toHaveProperty('username', 'john_doe');
    expect(response.body).toHaveProperty('permission_name', 'create_projects');
  });
  
  // Test GET specific user-permission assignment - not found
  test('GET /user-permissions/:userId/:permissionId - should return 404 for non-existent assignment', async () => {
    const response = await request(app).get('/user-permissions/1/5');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission assignment not found');
  });
  
  // Test POST assign permission to user
  test('POST /user-permissions - should assign permission to user', async () => {
    const assignment = {
      user_id: 2,
      permission_id: 1
    };
    
    const response = await request(app)
      .post('/user-permissions')
      .send(assignment);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Permission assigned successfully');
    expect(response.body).toHaveProperty('user_id', 2);
    expect(response.body).toHaveProperty('permission_id', 1);
    expect(response.body).toHaveProperty('username', 'jane_smith');
    expect(response.body).toHaveProperty('permission_name', 'create_projects');
    
    // Verify assignment was created
    const checkResponse = await request(app).get('/user-permissions/2/1');
    expect(checkResponse.status).toBe(200);
  });
  
  // Test POST assign permission - missing required fields
  test('POST /user-permissions - should return 400 for missing required fields', async () => {
    const incompleteAssignment = {
      user_id: 1
    };
    
    const response = await request(app)
      .post('/user-permissions')
      .send(incompleteAssignment);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'User ID and permission ID are required');
  });
  
  // Test POST assign permission - user not found
  test('POST /user-permissions - should return 404 for non-existent user', async () => {
    const assignment = {
      user_id: 999,
      permission_id: 1
    };
    
    const response = await request(app)
      .post('/user-permissions')
      .send(assignment);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test POST assign permission - permission not found
  test('POST /user-permissions - should return 404 for non-existent permission', async () => {
    const assignment = {
      user_id: 1,
      permission_id: 999
    };
    
    const response = await request(app)
      .post('/user-permissions')
      .send(assignment);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission not found');
  });
  
  // Test DELETE remove permission from user
  test('DELETE /user-permissions/:userId/:permissionId - should remove permission from user', async () => {
    const response = await request(app).delete('/user-permissions/1/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Permission removed from user successfully');
    
    // Verify assignment was removed
    const checkResponse = await request(app).get('/user-permissions/1/1');
    expect(checkResponse.status).toBe(404);
    
    const allAssignments = await request(app).get('/user-permissions');
    expect(allAssignments.body.length).toBe(3);
  });
  
  // Test DELETE remove permission - not found
  test('DELETE /user-permissions/:userId/:permissionId - should return 404 for non-existent assignment', async () => {
    const response = await request(app).delete('/user-permissions/1/5');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission assignment not found');
  });
  
  // Test GET permissions for specific user
  test('GET /user-permissions/user/:userId - should return all permissions for specific user', async () => {
    const response = await request(app).get('/user-permissions/user/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('description');
    
    // Check specific permissions
    const permissionNames = response.body.map(permission => permission.name);
    expect(permissionNames).toContain('create_projects');
    expect(permissionNames).toContain('edit_projects');
  });
  
  // Test GET permissions for specific user - user not found
  test('GET /user-permissions/user/:userId - should return 404 for non-existent user', async () => {
    const response = await request(app).get('/user-permissions/user/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test GET users with specific permission
  test('GET /user-permissions/permission/:permissionId - should return all users with specific permission', async () => {
    const response = await request(app).get('/user-permissions/permission/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('username');
    expect(response.body[0]).toHaveProperty('email');
    expect(response.body[0]).toHaveProperty('is_active');
    
    // Check specific users
    const usernames = response.body.map(user => user.username);
    expect(usernames).toContain('john_doe');
    expect(usernames).toContain('bob_wilson');
  });
  
  // Test GET users with specific permission - permission not found
  test('GET /user-permissions/permission/:permissionId - should return 404 for non-existent permission', async () => {
    const response = await request(app).get('/user-permissions/permission/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission not found');
  });
  
  // Test POST bulk assign permissions to user
  test('POST /user-permissions/user/:userId/bulkAssign - should assign multiple permissions to user', async () => {
    const bulkAssignment = {
      permission_ids: [3, 5]
    };
    
    const response = await request(app)
      .post('/user-permissions/user/3/bulkAssign')
      .send(bulkAssignment);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Permissions assigned successfully');
    expect(response.body).toHaveProperty('assigned_permissions');
    expect(Array.isArray(response.body.assigned_permissions)).toBeTruthy();
    expect(response.body.assigned_permissions.length).toBe(3); // 1 existing + 2 new
    
    // Verify permissions were assigned
    const userPermissions = await request(app).get('/user-permissions/user/3');
    expect(userPermissions.body.length).toBe(3);
  });
  
  // Test POST bulk assign - invalid input
  test('POST /user-permissions/user/:userId/bulkAssign - should return 400 for invalid input', async () => {
    const invalidAssignment = {
      permission_ids: []
    };
    
    const response = await request(app)
      .post('/user-permissions/user/1/bulkAssign')
      .send(invalidAssignment);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Permission IDs array is required');
  });
  
  // Test POST bulk assign - user not found
  test('POST /user-permissions/user/:userId/bulkAssign - should return 404 for non-existent user', async () => {
    const bulkAssignment = {
      permission_ids: [1, 2]
    };
    
    const response = await request(app)
      .post('/user-permissions/user/999/bulkAssign')
      .send(bulkAssignment);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test POST permission check - direct permission
  test('POST /user-permissions/check - should check direct permission assignment', async () => {
    const checkRequest = {
      user_id: 1,
      permission_name: 'create_projects'
    };
    
    const response = await request(app)
      .post('/user-permissions/check')
      .send(checkRequest);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('has_permission', true);
    expect(response.body).toHaveProperty('source', 'direct');
  });
  
  // Test POST permission check - role-based permission
  test('POST /user-permissions/check - should check role-based permission', async () => {
    const checkRequest = {
      user_id: 2,
      permission_name: 'manage_users'
    };
    
    const response = await request(app)
      .post('/user-permissions/check')
      .send(checkRequest);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('has_permission', true);
    expect(response.body).toHaveProperty('source', 'role');
  });
  
  // Test POST permission check - no permission
  test('POST /user-permissions/check - should return false for non-existent permission', async () => {
    const checkRequest = {
      user_id: 3,
      permission_name: 'manage_users'
    };
    
    const response = await request(app)
      .post('/user-permissions/check')
      .send(checkRequest);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('has_permission', false);
  });
  
  // Test POST permission check - invalid input
  test('POST /user-permissions/check - should return 400 for missing required fields', async () => {
    const incompleteRequest = {
      user_id: 1
    };
    
    const response = await request(app)
      .post('/user-permissions/check')
      .send(incompleteRequest);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'User ID and permission name are required');
  });
  
  // Test POST permission check - user not found
  test('POST /user-permissions/check - should return 404 for non-existent user', async () => {
    const checkRequest = {
      user_id: 999,
      permission_name: 'create_projects'
    };
    
    const response = await request(app)
      .post('/user-permissions/check')
      .send(checkRequest);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test duplicate assignment (should not create duplicate)
  test('POST /user-permissions - should handle duplicate assignment gracefully', async () => {
    const assignment = {
      user_id: 1,
      permission_id: 1 // This permission is already assigned to user 1
    };
    
    const response = await request(app)
      .post('/user-permissions')
      .send(assignment);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Permission assigned successfully');
    
    // Verify no duplicate was created
    const allAssignments = await request(app).get('/user-permissions');
    const duplicates = allAssignments.body.filter(
      assignment => assignment.user_id === 1 && assignment.permission_id === 1
    );
    expect(duplicates.length).toBe(1);
  });
});
