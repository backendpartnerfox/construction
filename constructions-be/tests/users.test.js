// tests/users.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS states (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(10)
    );
    
    CREATE TABLE IF NOT EXISTS cities (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      state_id INTEGER REFERENCES states(id)
    );
    
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL,
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      city_id INTEGER REFERENCES cities(id),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT
    );
    
    CREATE TABLE IF NOT EXISTS permissions (
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
  await pool.query('DROP TABLE IF EXISTS user_roles');
  await pool.query('DROP TABLE IF EXISTS permissions');
  await pool.query('DROP TABLE IF EXISTS roles');
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.query('DROP TABLE IF EXISTS cities');
  await pool.query('DROP TABLE IF EXISTS states');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM user_permissions');
  await pool.query('DELETE FROM user_roles');
  await pool.query('DELETE FROM permissions');
  await pool.query('DELETE FROM roles');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM cities');
  await pool.query('DELETE FROM states');
  
  // Insert test data
  await pool.query(`
    INSERT INTO states (id, name, code)
    VALUES 
      (1, 'Maharashtra', 'MH'),
      (2, 'Karnataka', 'KA')
  `);
  
  await pool.query(`
    INSERT INTO cities (id, name, state_id)
    VALUES 
      (1, 'Mumbai', 1),
      (2, 'Pune', 1),
      (3, 'Bangalore', 2)
  `);
  
  await pool.query(`
    INSERT INTO users (id, username, email, password, first_name, last_name, city_id, is_active)
    VALUES 
      (1, 'johndoe', 'john@example.com', 'password123', 'John', 'Doe', 1, true),
      (2, 'janedoe', 'jane@example.com', 'password123', 'Jane', 'Doe', 2, true)
  `);
  
  await pool.query(`
    INSERT INTO roles (id, name, description)
    VALUES 
      (1, 'admin', 'Administrator role'),
      (2, 'user', 'Regular user role')
  `);
  
  await pool.query(`
    INSERT INTO permissions (id, name, description)
    VALUES 
      (1, 'view_projects', 'Permission to view projects'),
      (2, 'edit_projects', 'Permission to edit projects')
  `);
  
  await pool.query(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES (1, 1)  -- johndoe has admin role
  `);
  
  await pool.query(`
    INSERT INTO user_permissions (user_id, permission_id)
    VALUES (1, 1)  -- johndoe has view_projects permission
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('states_id_seq', 2)");
  await pool.query("SELECT setval('cities_id_seq', 3)");
  await pool.query("SELECT setval('users_id_seq', 2)");
  await pool.query("SELECT setval('roles_id_seq', 2)");
  await pool.query("SELECT setval('permissions_id_seq', 2)");
  await pool.query("SELECT setval('user_roles_id_seq', 1)");
  await pool.query("SELECT setval('user_permissions_id_seq', 1)");
});

describe('Users API', () => {
  // Test GET all users
  test('GET /users - should return all users with location info', async () => {
    const response = await request(app).get('/users');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('username', 'johndoe');
    expect(response.body[0]).toHaveProperty('city_name', 'Mumbai');
    expect(response.body[0]).toHaveProperty('state_name', 'Maharashtra');
    expect(response.body[1]).toHaveProperty('username', 'janedoe');
    expect(response.body[1]).toHaveProperty('city_name', 'Pune');
  });
  
  // Test GET user by ID
  test('GET /users/:id - should return a specific user', async () => {
    const response = await request(app).get('/users/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('username', 'johndoe');
    expect(response.body).toHaveProperty('email', 'john@example.com');
    expect(response.body).toHaveProperty('city_id', 1);
    expect(response.body).toHaveProperty('city_name', 'Mumbai');
    expect(response.body).toHaveProperty('state_name', 'Maharashtra');
  });
  
  // Test GET user by ID - not found
  test('GET /users/:id - should return 404 for non-existent user', async () => {
    const response = await request(app).get('/users/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test POST create new user
  test('POST /users - should create a new user', async () => {
    const newUser = {
      username: 'bobsmith',
      email: 'bob@example.com',
      password: 'password123',
      first_name: 'Bob',
      last_name: 'Smith',
      city_id: 3,
      is_active: true
    };
    
    const response = await request(app)
      .post('/users')
      .send(newUser);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 3);
    expect(response.body).toHaveProperty('username', 'bobsmith');
    expect(response.body).toHaveProperty('email', 'bob@example.com');
    expect(response.body).toHaveProperty('city_id', 3);
    
    // Verify user was created
    const checkResponse = await request(app).get('/users/3');
    expect(checkResponse.status).toBe(200);
    expect(checkResponse.body.username).toBe('bobsmith');
  });
  
  // Test POST user - missing required fields
  test('POST /users - should return 400 for missing required fields', async () => {
    const incompleteUser = {
      username: 'incomplete',
      // Missing email and password
      first_name: 'Incomplete',
      last_name: 'User'
    };
    
    const response = await request(app)
      .post('/users')
      .send(incompleteUser);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Username, email, and password are required');
  });
  
  // Test POST user - duplicate username
  test('POST /users - should return 400 for duplicate username', async () => {
    const duplicateUser = {
      username: 'johndoe', // Already exists
      email: 'unique@example.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Duplicate'
    };
    
    const response = await request(app)
      .post('/users')
      .send(duplicateUser);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Username already exists');
  });
  
  // Test POST user - duplicate email
  test('POST /users - should return 400 for duplicate email', async () => {
    const duplicateUser = {
      username: 'unique',
      email: 'john@example.com', // Already exists
      password: 'password123',
      first_name: 'Unique',
      last_name: 'User'
    };
    
    const response = await request(app)
      .post('/users')
      .send(duplicateUser);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Email already exists');
  });
  
  // Test PUT update user
  test('PUT /users/:id - should update a user', async () => {
    const updatedData = {
      username: 'johndoe_updated',
      email: 'john_updated@example.com',
      first_name: 'John',
      last_name: 'Updated',
      city_id: 2,
      is_active: true
    };
    
    const response = await request(app)
      .put('/users/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('username', 'johndoe_updated');
    expect(response.body).toHaveProperty('email', 'john_updated@example.com');
    expect(response.body).toHaveProperty('city_id', 2);
    
    // Verify user was updated
    const checkResponse = await request(app).get('/users/1');
    expect(checkResponse.body.username).toBe('johndoe_updated');
    expect(checkResponse.body.city_id).toBe(2);
  });
  
  // Test PUT update user - not found
  test('PUT /users/:id - should return 404 for non-existent user', async () => {
    const updatedData = {
      username: 'nonexistent',
      email: 'nonexistent@example.com',
      first_name: 'Non',
      last_name: 'Existent'
    };
    
    const response = await request(app)
      .put('/users/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  // Test PUT update password
  test('PUT /users/:id/password - should update a user\'s password', async () => {
    const passwordData = {
      password: 'newpassword123'
    };
    
    const response = await request(app)
      .put('/users/1/password')
      .send(passwordData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Password updated successfully');
  });
  
  // Test DELETE user
  test('DELETE /users/:id - should delete a user', async () => {
    const response = await request(app).delete('/users/2');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'User deleted successfully');
    
    // Verify user was deleted
    const checkResponse = await request(app).get('/users/2');
    expect(checkResponse.status).toBe(404);
  });
  
  // Test GET user roles
  test('GET /users/:id/roles - should return roles for a user', async () => {
    const response = await request(app).get('/users/1/roles');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('id', 1);
    expect(response.body[0]).toHaveProperty('name', 'admin');
  });
  
  // Test GET user permissions
  test('GET /users/:id/permissions - should return permissions for a user', async () => {
    const response = await request(app).get('/users/1/permissions');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('id', 1);
    expect(response.body[0]).toHaveProperty('name', 'view_projects');
  });
  
  // Test POST assign role to user
  test('POST /users/:id/roles - should assign a role to a user', async () => {
    const roleData = {
      role_id: 2
    };
    
    const response = await request(app)
      .post('/users/2/roles')
      .send(roleData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Role assigned successfully');
    expect(response.body).toHaveProperty('user_id', 2);
    expect(response.body).toHaveProperty('role_id', 2);
    
    // Verify role was assigned
    const rolesResponse = await request(app).get('/users/2/roles');
    expect(rolesResponse.body.length).toBe(1);
    expect(rolesResponse.body[0].name).toBe('user');
  });
  
  // Test POST assign permission to user
  test('POST /users/:id/permissions - should assign a permission to a user', async () => {
    const permissionData = {
      permission_id: 2
    };
    
    const response = await request(app)
      .post('/users/1/permissions')
      .send(permissionData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Permission assigned successfully');
    expect(response.body).toHaveProperty('user_id', 1);
    expect(response.body).toHaveProperty('permission_id', 2);
    
    // Verify permission was assigned
    const permissionsResponse = await request(app).get('/users/1/permissions');
    expect(permissionsResponse.body.length).toBe(2);
  });
  
  // Test DELETE remove role from user
  test('DELETE /users/:userId/roles/:roleId - should remove a role from a user', async () => {
    const response = await request(app).delete('/users/1/roles/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Role removed from user successfully');
    
    // Verify role was removed
    const rolesResponse = await request(app).get('/users/1/roles');
    expect(rolesResponse.body.length).toBe(0);
  });
  
  // Test DELETE remove permission from user
  test('DELETE /users/:userId/permissions/:permissionId - should remove a permission from a user', async () => {
    const response = await request(app).delete('/users/1/permissions/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Permission removed from user successfully');
    
    // Verify permission was removed
    const permissionsResponse = await request(app).get('/users/1/permissions');
    expect(permissionsResponse.body.length).toBe(0);
  });
});
