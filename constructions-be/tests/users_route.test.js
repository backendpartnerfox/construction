// tests/users_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data
const testData = {
  seedData: {
    states: [
      { id: 1, name: 'Test State', country_id: 1 }
    ],
    cities: [
      { id: 1, name: 'Test City', state_id: 1 },
      { id: 2, name: 'Another City', state_id: 1 }
    ],
    users: [
      {
        id: 1,
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        city_id: 1,
        is_active: true
      },
      {
        id: 2,
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password456',
        first_name: 'Another',
        last_name: 'User',
        city_id: 2,
        is_active: false
      }
    ],
    roles: [
      { id: 1, name: 'Admin', description: 'Administrator role' },
      { id: 2, name: 'Manager', description: 'Manager role' }
    ],
    permissions: [
      { id: 1, name: 'create_user', description: 'Can create users' },
      { id: 2, name: 'delete_user', description: 'Can delete users' }
    ]
  },
  createData: {
    valid: {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'newpass123',
      first_name: 'New',
      last_name: 'User',
      city_id: 1,
      is_active: true
    },
    minimalValid: {
      username: 'minimaluser',
      email: 'minimal@example.com',
      password: 'pass123'
    },
    invalid: {
      missingRequired: {
        first_name: 'Missing',
        last_name: 'Required'
      },
      duplicateUsername: {
        username: 'testuser1',
        email: 'different@example.com',
        password: 'pass123'
      },
      duplicateEmail: {
        username: 'differentuser',
        email: 'test1@example.com',
        password: 'pass123'
      },
      invalidCity: {
        username: 'invalidcity',
        email: 'invalidcity@example.com',
        password: 'pass123',
        city_id: 999
      }
    }
  },
  updateData: {
    valid: {
      username: 'updateduser',
      email: 'updated@example.com',
      first_name: 'Updated',
      last_name: 'Name',
      city_id: 2,
      is_active: false
    },
    partialValid: {
      username: 'partialupdate',
      email: 'partial@example.com'
    },
    invalid: {
      missingRequired: {
        first_name: 'Missing Username'
      },
      duplicateUsername: {
        username: 'testuser2',
        email: 'unique@example.com'
      }
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS states (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      country_id INT
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cities (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      state_id INT,
      FOREIGN KEY (state_id) REFERENCES states(id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      city_id INT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (city_id) REFERENCES cities(id)
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
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INT NOT NULL,
      role_id INT NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      user_id INT NOT NULL,
      permission_id INT NOT NULL,
      PRIMARY KEY (user_id, permission_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);
});

afterAll(async () => {
  // Clean up
  await pool.query('DROP TABLE IF EXISTS user_permissions CASCADE');
  await pool.query('DROP TABLE IF EXISTS user_roles CASCADE');
  await pool.query('DROP TABLE IF EXISTS permissions CASCADE');
  await pool.query('DROP TABLE IF EXISTS roles CASCADE');
  await pool.query('DROP TABLE IF EXISTS users CASCADE');
  await pool.query('DROP TABLE IF EXISTS cities CASCADE');
  await pool.query('DROP TABLE IF EXISTS states CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear and reseed data
  await pool.query('TRUNCATE TABLE user_permissions, user_roles, permissions, roles, users, cities, states RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const state of testData.seedData.states) {
    await pool.query(
      'INSERT INTO states (id, name, country_id) VALUES ($1, $2, $3)',
      [state.id, state.name, state.country_id]
    );
  }
  
  for (const city of testData.seedData.cities) {
    await pool.query(
      'INSERT INTO cities (id, name, state_id) VALUES ($1, $2, $3)',
      [city.id, city.name, city.state_id]
    );
  }
  
  for (const user of testData.seedData.users) {
    await pool.query(
      'INSERT INTO users (id, username, email, password, first_name, last_name, city_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [user.id, user.username, user.email, user.password, user.first_name, user.last_name, user.city_id, user.is_active]
    );
  }
  
  for (const role of testData.seedData.roles) {
    await pool.query(
      'INSERT INTO roles (id, name, description) VALUES ($1, $2, $3)',
      [role.id, role.name, role.description]
    );
  }
  
  for (const permission of testData.seedData.permissions) {
    await pool.query(
      'INSERT INTO permissions (id, name, description) VALUES ($1, $2, $3)',
      [permission.id, permission.name, permission.description]
    );
  }
  
  // Reset sequences
  await pool.query("SELECT setval('states_id_seq', 1)");
  await pool.query("SELECT setval('cities_id_seq', 2)");
  await pool.query("SELECT setval('users_id_seq', 2)");
  await pool.query("SELECT setval('roles_id_seq', 2)");
  await pool.query("SELECT setval('permissions_id_seq', 2)");
});

describe('Users API', () => {
  
  describe('GET /users', () => {
    test('should return all users with location information', async () => {
      const response = await request(app).get('/users');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      
      const firstUser = response.body[0];
      expect(firstUser).toHaveProperty('id');
      expect(firstUser).toHaveProperty('username');
      expect(firstUser).toHaveProperty('email');
      expect(firstUser).toHaveProperty('city_name');
      expect(firstUser).toHaveProperty('state_name');
      expect(firstUser).not.toHaveProperty('password');
    });
  });
  
  describe('GET /users/:id', () => {
    test('should return specific user by ID', async () => {
      const response = await request(app).get('/users/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('username', 'testuser1');
      expect(response.body).toHaveProperty('email', 'test1@example.com');
      expect(response.body).toHaveProperty('city_name', 'Test City');
      expect(response.body).toHaveProperty('state_name', 'Test State');
    });
    
    test('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/users/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });
  
  describe('POST /users', () => {
    test('should create new user with all fields', async () => {
      const response = await request(app)
        .post('/users')
        .send(testData.createData.valid);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 3);
      expect(response.body).toHaveProperty('username', 'newuser');
      expect(response.body).toHaveProperty('email', 'newuser@example.com');
      expect(response.body).toHaveProperty('first_name', 'New');
      expect(response.body).toHaveProperty('last_name', 'User');
      expect(response.body).toHaveProperty('is_active', true);
    });
    
    test('should create user with minimal fields', async () => {
      const response = await request(app)
        .post('/users')
        .send(testData.createData.minimalValid);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('username', 'minimaluser');
      expect(response.body).toHaveProperty('is_active', true); // Default value
    });
    
    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/users')
        .send(testData.createData.invalid.missingRequired);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username, email, and password are required');
    });
    
    test('should fail with duplicate username', async () => {
      const response = await request(app)
        .post('/users')
        .send(testData.createData.invalid.duplicateUsername);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username already exists');
    });
    
    test('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/users')
        .send(testData.createData.invalid.duplicateEmail);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email already exists');
    });
    
    test('should fail with invalid city', async () => {
      const response = await request(app)
        .post('/users')
        .send(testData.createData.invalid.invalidCity);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'City not found');
    });
  });
  
  describe('PUT /users/:id', () => {
    test('should update user with all fields', async () => {
      const response = await request(app)
        .put('/users/1')
        .send(testData.updateData.valid);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('username', 'updateduser');
      expect(response.body).toHaveProperty('email', 'updated@example.com');
      expect(response.body).toHaveProperty('first_name', 'Updated');
      expect(response.body).toHaveProperty('is_active', false);
    });
    
    test('should update user with partial fields', async () => {
      const response = await request(app)
        .put('/users/2')
        .send(testData.updateData.partialValid);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'partialupdate');
      expect(response.body).toHaveProperty('email', 'partial@example.com');
    });
    
    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .put('/users/1')
        .send(testData.updateData.invalid.missingRequired);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username and email are required');
    });
    
    test('should fail with duplicate username', async () => {
      const response = await request(app)
        .put('/users/1')
        .send(testData.updateData.invalid.duplicateUsername);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username already exists');
    });
    
    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/users/999')
        .send(testData.updateData.valid);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });
  
  describe('PUT /users/:id/password', () => {
    test('should update user password', async () => {
      const response = await request(app)
        .put('/users/1/password')
        .send({ password: 'newpassword123' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password updated successfully');
    });
    
    test('should fail with missing password', async () => {
      const response = await request(app)
        .put('/users/1/password')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Password is required');
    });
    
    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/users/999/password')
        .send({ password: 'newpassword123' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });
  
  describe('DELETE /users/:id', () => {
    test('should delete existing user', async () => {
      const response = await request(app).delete('/users/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/users/1');
      expect(checkResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent user', async () => {
      const response = await request(app).delete('/users/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });
  
  describe('GET /users/:id/roles', () => {
    test('should return empty array for user with no roles', async () => {
      const response = await request(app).get('/users/1/roles');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
    
    test('should return roles after assignment', async () => {
      // First assign a role
      await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES (1, 1), (1, 2)');
      
      const response = await request(app).get('/users/1/roles');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('description');
    });
    
    test('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/users/999/roles');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });
  
  describe('GET /users/:id/permissions', () => {
    test('should return empty array for user with no permissions', async () => {
      const response = await request(app).get('/users/1/permissions');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
    
    test('should return permissions after assignment', async () => {
      // First assign permissions
      await pool.query('INSERT INTO user_permissions (user_id, permission_id) VALUES (1, 1), (1, 2)');
      
      const response = await request(app).get('/users/1/permissions');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('description');
    });
  });
  
  describe('POST /users/:id/roles', () => {
    test('should assign role to user', async () => {
      const response = await request(app)
        .post('/users/1/roles')
        .send({ role_id: 1 });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Role assigned successfully');
      expect(response.body).toHaveProperty('user_id', 1);
      expect(response.body).toHaveProperty('role_id', 1);
      expect(response.body).toHaveProperty('role_name', 'Admin');
    });
    
    test('should fail with missing role_id', async () => {
      const response = await request(app)
        .post('/users/1/roles')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Role ID is required');
    });
    
    test('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/users/999/roles')
        .send({ role_id: 1 });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
    
    test('should fail with non-existent role', async () => {
      const response = await request(app)
        .post('/users/1/roles')
        .send({ role_id: 999 });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Role not found');
    });
  });
  
  describe('POST /users/:id/permissions', () => {
    test('should assign permission to user', async () => {
      const response = await request(app)
        .post('/users/1/permissions')
        .send({ permission_id: 1 });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Permission assigned successfully');
      expect(response.body).toHaveProperty('user_id', 1);
      expect(response.body).toHaveProperty('permission_id', 1);
      expect(response.body).toHaveProperty('permission_name', 'create_user');
    });
    
    test('should fail with missing permission_id', async () => {
      const response = await request(app)
        .post('/users/1/permissions')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Permission ID is required');
    });
  });
  
  describe('DELETE /users/:userId/roles/:roleId', () => {
    test('should remove role from user', async () => {
      // First assign a role
      await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES (1, 1)');
      
      const response = await request(app).delete('/users/1/roles/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Role removed from user successfully');
      
      // Verify removal
      const checkResponse = await request(app).get('/users/1/roles');
      expect(checkResponse.body.length).toBe(0);
    });
    
    test('should return 404 for non-existent assignment', async () => {
      const response = await request(app).delete('/users/1/roles/1');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User-role assignment not found');
    });
  });
  
  describe('DELETE /users/:userId/permissions/:permissionId', () => {
    test('should remove permission from user', async () => {
      // First assign a permission
      await pool.query('INSERT INTO user_permissions (user_id, permission_id) VALUES (1, 1)');
      
      const response = await request(app).delete('/users/1/permissions/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Permission removed from user successfully');
      
      // Verify removal
      const checkResponse = await request(app).get('/users/1/permissions');
      expect(checkResponse.body.length).toBe(0);
    });
    
    test('should return 404 for non-existent assignment', async () => {
      const response = await request(app).delete('/users/1/permissions/1');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User-permission assignment not found');
    });
  });
});
