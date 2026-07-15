// tests/permissions_route.test.js
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
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100),
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      permission_id INTEGER REFERENCES permissions(id),
      UNIQUE(user_id, permission_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS user_permissions');
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.query('DROP TABLE IF EXISTS permissions');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM user_permissions');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM permissions');
  
  // Insert test data for permissions
  await pool.query(`
    INSERT INTO permissions (id, name, description)
    VALUES 
      (1, 'view_projects', 'Can view projects'),
      (2, 'edit_projects', 'Can edit projects'),
      (3, 'delete_projects', 'Can delete projects')
  `);
  
  // Insert test data for users
  await pool.query(`
    INSERT INTO users (id, username, email, first_name, last_name, is_active)
    VALUES 
      (1, 'user1', 'user1@example.com', 'John', 'Doe', true),
      (2, 'user2', 'user2@example.com', 'Jane', 'Smith', true)
  `);
  
  // Assign permissions to users
  await pool.query(`
    INSERT INTO user_permissions (user_id, permission_id)
    VALUES 
      (1, 1), -- User 1 can view projects
      (1, 2), -- User 1 can edit projects
      (2, 1)  -- User 2 can only view projects
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('permissions_id_seq', 3)");
  await pool.query("SELECT setval('users_id_seq', 2)");
  await pool.query("SELECT setval('user_permissions_id_seq', 3)");
});

describe('Permissions API', () => {
  // Test GET all permissions
  test('GET /permissions - should return all permissions', async () => {
    const response = await request(app).get('/permissions');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('description');
    
    // Check specific permissions
    const viewPermission = response.body.find(permission => permission.name === 'view_projects');
    expect(viewPermission).toBeDefined();
    expect(viewPermission.description).toBe('Can view projects');
    
    const editPermission = response.body.find(permission => permission.name === 'edit_projects');
    expect(editPermission).toBeDefined();
    expect(editPermission.description).toBe('Can edit projects');
  });
  
  // Test GET permission by ID
  test('GET /permissions/:id - should return a specific permission', async () => {
    const response = await request(app).get('/permissions/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'view_projects');
    expect(response.body).toHaveProperty('description', 'Can view projects');
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
      name: 'create_projects',
      description: 'Can create new projects'
    };
    
    const response = await request(app)
      .post('/permissions')
      .send(newPermission);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 4);
    expect(response.body).toHaveProperty('name', 'create_projects');
    expect(response.body).toHaveProperty('description', 'Can create new projects');
    
    // Verify permission was actually created
    const allPermissions = await request(app).get('/permissions');
    expect(allPermissions.body.length).toBe(4);
    
    const createPermission = allPermissions.body.find(p => p.name === 'create_projects');
    expect(createPermission).toBeDefined();
  });
  
  // Test POST permission - missing required field
  test('POST /permissions - should return 400 for missing name', async () => {
    const incompletePermission = {
      description: 'Some description'
      // Missing name
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
      name: 'view_projects', // Already exists
      description: 'Another view projects permission'
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
      name: 'view_all_projects',
      description: 'Can view all projects, including archived ones'
    };
    
    const response = await request(app)
      .put('/permissions/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'view_all_projects');
    expect(response.body).toHaveProperty('description', 'Can view all projects, including archived ones');
    
    // Verify permission was actually updated
    const updatedPermission = await request(app).get('/permissions/1');
    expect(updatedPermission.body.name).toBe('view_all_projects');
    expect(updatedPermission.body.description).toBe('Can view all projects, including archived ones');
  });
  
  // Test PUT permission - missing required field
  test('PUT /permissions/:id - should return 400 for missing name', async () => {
    const incompletePermission = {
      description: 'Some description'
      // Missing name
    };
    
    const response = await request(app)
      .put('/permissions/1')
      .send(incompletePermission);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Permission name is required');
  });
  
  // Test PUT permission - duplicate name
  test('PUT /permissions/:id - should return 400 for duplicate name', async () => {
    const duplicatePermission = {
      name: 'edit_projects', // Already exists on another permission
      description: 'Updated description'
    };
    
    const response = await request(app)
      .put('/permissions/1')
      .send(duplicatePermission);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Permission with this name already exists');
  });
  
  // Test PUT permission - not found
  test('PUT /permissions/:id - should return 404 for non-existent permission', async () => {
    const updatedData = {
      name: 'non_existent_permission',
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
    // First, we test with a permission that has no user assignments
    const response = await request(app).delete('/permissions/3'); // delete_projects has no assignments
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Permission deleted successfully');
    
    // Verify permission was actually deleted
    const deletedPermission = await request(app).get('/permissions/3');
    expect(deletedPermission.status).toBe(404);
    
    const allPermissions = await request(app).get('/permissions');
    expect(allPermissions.body.length).toBe(2);
  });
  
  // Test DELETE permission - with user assignments
  test('DELETE /permissions/:id - should return 400 for permission with user assignments', async () => {
    const response = await request(app).delete('/permissions/1'); // view_projects has user assignments
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete permission because it is directly assigned to users. Remove all permission assignments first.');
  });
  
  // Test DELETE permission - not found
  test('DELETE /permissions/:id - should return 404 for non-existent permission', async () => {
    const response = await request(app).delete('/permissions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission not found');
  });
  
  // Test GET users with a specific permission
  test('GET /permissions/:id/users - should return users with a specific permission', async () => {
    const response = await request(app).get('/permissions/1/users'); // view_projects permission
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); // Both users have view_projects permission
    
    // Check user details
    const usernames = response.body.map(user => user.username);
    expect(usernames).toContain('user1');
    expect(usernames).toContain('user2');
    
    // Test with permission that has only one user
    const editResponse = await request(app).get('/permissions/2/users'); // edit_projects permission
    
    expect(editResponse.status).toBe(200);
    expect(editResponse.body.length).toBe(1); // Only user1 has edit_projects permission
    expect(editResponse.body[0]).toHaveProperty('username', 'user1');
  });
  
  // Test GET users with a permission - permission not found
  test('GET /permissions/:id/users - should return 404 for non-existent permission', async () => {
    const response = await request(app).get('/permissions/999/users');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Permission not found');
  });
});
