// tests/permissions.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT
    );
    
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      is_active BOOLEAN DEFAULT true
    );
    
    CREATE TABLE IF NOT EXISTS user_permissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      permission_id INTEGER NOT NULL REFERENCES permissions(id),
      UNIQUE(user_id, permission_id)
    );
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS user_permissions');
  await pool.query('DROP TABLE IF EXISTS permissions');
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM user_permissions');
  await pool.query('DELETE FROM permissions');
  await pool.query('DELETE FROM users');
  
  // Insert test data
  await pool.query(`
    INSERT INTO permissions (id, name, description)
    VALUES 
      (1, 'create_project', 'Permission to create projects'),
      (2, 'edit_project', 'Permission to edit projects')
  `);
  
  await pool.query(`
    INSERT INTO users (id, username, email, first_name, last_name, is_active)
    VALUES 
      (1, 'testuser', 'test@example.com', 'Test', 'User', true)
  `);
  
  await pool.query(`
    INSERT INTO user_permissions (user_id, permission_id)
    VALUES (1, 1)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('permissions_id_seq', 2)");
  await pool.query("SELECT setval('users_id_seq', 1)");
  await pool.query("SELECT setval('user_permissions_id_seq', 1)");
});

describe('Permissions API', () => {
  // Test GET all permissions
  test('GET /permissions - should return all permissions', async () => {
    const response = await request(app).get('/permissions');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('name', 'create_project');
    expect(response.body[1]).toHaveProperty('name', 'edit_project');
  });
  
  // Test GET permission by ID
  test('GET /permissions/:id - should return a specific permission', async () => {
    const response = await request(app).get('/permissions/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'create_project');
    expect(response.body).toHaveProperty('description', 'Permission to create projects');
  });
  
  // Test GET permission by ID - not found
  test('GET /permissions/:id - should return 404 for non-existent permission', async () => {
    const response = await request(app).get('/permissions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission not found');
  });
  
  // Test POST new permission
  test('POST /permissions - should create a new permission', async () => {
    const newPermission = {
      name: 'delete_project',
      description: 'Permission to delete projects'
    };
    
    const response = await request(app)
      .post('/permissions')
      .send(newPermission);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 3);
    expect(response.body).toHaveProperty('name', 'delete_project');
    expect(response.body).toHaveProperty('description', 'Permission to delete projects');
    
    // Verify permission was actually created
    const allPermissions = await request(app).get('/permissions');
    expect(allPermissions.body.length).toBe(3);
  });
  
  // Test POST permission - missing required field
  test('POST /permissions - should return 400 for missing name', async () => {
    const incompletePermission = {
      description: 'Missing name permission'
    };
    
    const response = await request(app)
      .post('/permissions')
      .send(incompletePermission);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Permission name is required');
  });
  
  // Test POST permission - duplicate name
  test('POST /permissions - should return 400 for duplicate name', async () => {
    const duplicatePermission = {
      name: 'create_project',
      description: 'Duplicate name'
    };
    
    const response = await request(app)
      .post('/permissions')
      .send(duplicatePermission);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Permission with this name already exists');
  });
  
  // Test PUT update permission
  test('PUT /permissions/:id - should update a permission', async () => {
    const updatedData = {
      name: 'update_project',
      description: 'Updated description for permission'
    };
    
    const response = await request(app)
      .put('/permissions/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'update_project');
    expect(response.body).toHaveProperty('description', 'Updated description for permission');
    
    // Verify permission was actually updated
    const updatedPermission = await request(app).get('/permissions/1');
    expect(updatedPermission.body.name).toBe('update_project');
  });
  
  // Test PUT permission - not found
  test('PUT /permissions/:id - should return 404 for non-existent permission', async () => {
    const updatedData = {
      name: 'non_existent',
      description: 'This permission does not exist'
    };
    
    const response = await request(app)
      .put('/permissions/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission not found');
  });
  
  // Test DELETE permission
  test('DELETE /permissions/:id - should delete a permission', async () => {
    const response = await request(app).delete('/permissions/2');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Permission deleted successfully');
    
    // Verify permission was actually deleted
    const deletedPermission = await request(app).get('/permissions/2');
    expect(deletedPermission.status).toBe(404);
    
    const allPermissions = await request(app).get('/permissions');
    expect(allPermissions.body.length).toBe(1);
  });
  
  // Test DELETE permission with user assignments
  test('DELETE /permissions/:id - should return 400 for permission with user assignments', async () => {
    const response = await request(app).delete('/permissions/1');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete permission because it is directly assigned to users. Remove all permission assignments first.');
  });
  
  // Test GET users by permission ID
  test('GET /permissions/:id/users - should return users with a specific permission', async () => {
    const response = await request(app).get('/permissions/1/users');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('username', 'testuser');
    expect(response.body[0]).toHaveProperty('email', 'test@example.com');
  });
  
  // Test GET users by permission ID - not found
  test('GET /permissions/:id/users - should return 404 for non-existent permission', async () => {
    const response = await request(app).get('/permissions/999/users');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission not found');
  });
});
