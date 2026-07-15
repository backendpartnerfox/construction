// tests/roles.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
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
    INSERT INTO roles (id, name, description)
    VALUES 
      (1, 'admin', 'Administrator role'),
      (2, 'manager', 'Manager role')
  `);
  
  await pool.query(`
    INSERT INTO users (id, username, email, first_name, last_name, is_active)
    VALUES 
      (1, 'testuser', 'test@example.com', 'Test', 'User', true)
  `);
  
  await pool.query(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES (1, 1)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('roles_id_seq', 2)");
  await pool.query("SELECT setval('users_id_seq', 1)");
  await pool.query("SELECT setval('user_roles_id_seq', 1)");
});

describe('Roles API', () => {
  // Test GET all roles
  test('GET /roles - should return all roles', async () => {
    const response = await request(app).get('/roles');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('name', 'admin');
    expect(response.body[1]).toHaveProperty('name', 'manager');
  });
  
  // Test GET role by ID
  test('GET /roles/:id - should return a specific role', async () => {
    const response = await request(app).get('/roles/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'admin');
    expect(response.body).toHaveProperty('description', 'Administrator role');
  });
  
  // Test GET role by ID - not found
  test('GET /roles/:id - should return 404 for non-existent role', async () => {
    const response = await request(app).get('/roles/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Role not found');
  });
  
  // Test POST new role
  test('POST /roles - should create a new role', async () => {
    const newRole = {
      name: 'user',
      description: 'Standard user role'
    };
    
    const response = await request(app)
      .post('/roles')
      .send(newRole);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 3);
    expect(response.body).toHaveProperty('name', 'user');
    expect(response.body).toHaveProperty('description', 'Standard user role');
    
    // Verify role was actually created
    const allRoles = await request(app).get('/roles');
    expect(allRoles.body.length).toBe(3);
  });
  
  // Test POST role - missing required field
  test('POST /roles - should return 400 for missing name', async () => {
    const incompleteRole = {
      description: 'Missing name role'
    };
    
    const response = await request(app)
      .post('/roles')
      .send(incompleteRole);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Role name is required');
  });
  
  // Test POST role - duplicate name
  test('POST /roles - should return 400 for duplicate name', async () => {
    const duplicateRole = {
      name: 'admin',
      description: 'Duplicate name'
    };
    
    const response = await request(app)
      .post('/roles')
      .send(duplicateRole);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Role with this name already exists');
  });
  
  // Test PUT update role
  test('PUT /roles/:id - should update a role', async () => {
    const updatedData = {
      name: 'super_admin',
      description: 'Updated description for role'
    };
    
    const response = await request(app)
      .put('/roles/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'super_admin');
    expect(response.body).toHaveProperty('description', 'Updated description for role');
    
    // Verify role was actually updated
    const updatedRole = await request(app).get('/roles/1');
    expect(updatedRole.body.name).toBe('super_admin');
  });
  
  // Test PUT role - not found
  test('PUT /roles/:id - should return 404 for non-existent role', async () => {
    const updatedData = {
      name: 'non_existent',
      description: 'This role does not exist'
    };
    
    const response = await request(app)
      .put('/roles/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Role not found');
  });
  
  // Test DELETE role
  test('DELETE /roles/:id - should delete a role', async () => {
    const response = await request(app).delete('/roles/2');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Role deleted successfully');
    
    // Verify role was actually deleted
    const deletedRole = await request(app).get('/roles/2');
    expect(deletedRole.status).toBe(404);
    
    const allRoles = await request(app).get('/roles');
    expect(allRoles.body.length).toBe(1);
  });
  
  // Test DELETE role with user assignments
  test('DELETE /roles/:id - should return 400 for role with user assignments', async () => {
    const response = await request(app).delete('/roles/1');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete role because it is assigned to users. Remove all role assignments first.');
  });
  
  // Test GET users by role ID
  test('GET /roles/:id/users - should return users with a specific role', async () => {
    const response = await request(app).get('/roles/1/users');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('username', 'testuser');
    expect(response.body[0]).toHaveProperty('email', 'test@example.com');
  });
  
  // Test GET users by role ID - not found
  test('GET /roles/:id/users - should return 404 for non-existent role', async () => {
    const response = await request(app).get('/roles/999/users');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Role not found');
  });
});
