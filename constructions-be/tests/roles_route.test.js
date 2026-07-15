// tests/roles_route.test.js
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
      role_id SERIAL PRIMARY KEY,
      role_name VARCHAR(100) NOT NULL UNIQUE,
      role_description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      permission_id SERIAL PRIMARY KEY,
      permission_name VARCHAR(100) NOT NULL UNIQUE,
      permission_description TEXT,
      module VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_permission_id SERIAL PRIMARY KEY,
      role_id INT NOT NULL,
      permission_id INT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE,
      UNIQUE(role_id, permission_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_role_id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      role_id INT NOT NULL,
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
      UNIQUE(user_id, role_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS user_roles');
  await pool.query('DROP TABLE IF EXISTS role_permissions');
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.query('DROP TABLE IF EXISTS permissions');
  await pool.query('DROP TABLE IF EXISTS roles');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM user_roles');
  await pool.query('DELETE FROM role_permissions');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM permissions');
  await pool.query('DELETE FROM roles');
  
  // Insert test data
  await pool.query(`
    INSERT INTO roles (role_id, role_name, role_description, is_active)
    VALUES 
      (1, 'Admin', 'Full system access with all permissions', true),
      (2, 'Sales Manager', 'Manage sales team and view reports', true),
      (3, 'Sales Executive', 'Handle leads and quotations', true),
      (4, 'Architect', 'Design and technical approvals', true),
      (5, 'Inactive Role', 'Test inactive role', false)
  `);
  
  await pool.query(`
    INSERT INTO permissions (permission_id, permission_name, permission_description, module)
    VALUES 
      (1, 'view_users', 'View user list', 'Users'),
      (2, 'create_users', 'Create new users', 'Users'),
      (3, 'edit_users', 'Edit user details', 'Users'),
      (4, 'delete_users', 'Delete users', 'Users'),
      (5, 'view_leads', 'View leads', 'Sales'),
      (6, 'create_leads', 'Create new leads', 'Sales'),
      (7, 'edit_leads', 'Edit lead details', 'Sales'),
      (8, 'view_projects', 'View projects', 'Projects'),
      (9, 'create_projects', 'Create new projects', 'Projects'),
      (10, 'approve_designs', 'Approve architectural designs', 'Design')
  `);
  
  await pool.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES 
      (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
      (2, 1), (2, 5), (2, 6), (2, 7), (2, 8),
      (3, 5), (3, 6), (3, 7),
      (4, 8), (4, 10)
  `);
  
  await pool.query(`
    INSERT INTO users (user_id, username, email)
    VALUES 
      (1, 'john_admin', 'john@company.com'),
      (2, 'jane_sales', 'jane@company.com'),
      (3, 'bob_exec', 'bob@company.com')
  `);
  
  await pool.query(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES 
      (1, 1),
      (2, 2),
      (3, 3)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('roles_role_id_seq', 5)");
  await pool.query("SELECT setval('permissions_permission_id_seq', 10)");
  await pool.query("SELECT setval('users_user_id_seq', 3)");
});

describe('Roles API', () => {
  // Test GET all roles
  test('GET /roles - should return all roles', async () => {
    const response = await request(app).get('/roles');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(5);
    expect(response.body[0]).toHaveProperty('role_id');
    expect(response.body[0]).toHaveProperty('role_name');
    expect(response.body[0]).toHaveProperty('role_description');
    expect(response.body[0]).toHaveProperty('is_active');
    
    // Check specific role
    const adminRole = response.body.find(role => role.role_name === 'Admin');
    expect(adminRole).toBeDefined();
    expect(adminRole.role_description).toBe('Full system access with all permissions');
    expect(adminRole.is_active).toBe(true);
  });
  
  // Test GET role by ID
  test('GET /roles/:id - should return a specific role with permissions', async () => {
    const response = await request(app).get('/roles/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('role_id', 1);
    expect(response.body).toHaveProperty('role_name', 'Admin');
    expect(response.body).toHaveProperty('role_description', 'Full system access with all permissions');
    expect(response.body).toHaveProperty('is_active', true);
    expect(response.body).toHaveProperty('permissions');
    expect(Array.isArray(response.body.permissions)).toBeTruthy();
    expect(response.body.permissions.length).toBe(10); // Admin has all 10 permissions
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
      role_name: 'Project Manager',
      role_description: 'Manage construction projects and teams',
      is_active: true
    };
    
    const response = await request(app)
      .post('/roles')
      .send(newRole);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('role_id', 6);
    expect(response.body).toHaveProperty('role_name', 'Project Manager');
    expect(response.body).toHaveProperty('role_description', 'Manage construction projects and teams');
    expect(response.body).toHaveProperty('is_active', true);
    
    // Verify role was actually created
    const allRoles = await request(app).get('/roles');
    expect(allRoles.body.length).toBe(6);
  });
  
  // Test POST role - duplicate name
  test('POST /roles - should return 409 for duplicate role name', async () => {
    const duplicateRole = {
      role_name: 'Admin',
      role_description: 'Another admin role'
    };
    
    const response = await request(app)
      .post('/roles')
      .send(duplicateRole);
    
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error', 'Role name already exists');
  });
  
  // Test POST role - missing required fields
  test('POST /roles - should return 400 for missing role name', async () => {
    const incompleteRole = {
      role_description: 'Some description'
      // Missing role_name
    };
    
    const response = await request(app)
      .post('/roles')
      .send(incompleteRole);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Role name is required');
  });
  
  // Test PUT update role
  test('PUT /roles/:id - should update a role', async () => {
    const updatedData = {
      role_name: 'Senior Sales Manager',
      role_description: 'Manage sales team, view reports, and approve quotations',
      is_active: true
    };
    
    const response = await request(app)
      .put('/roles/2')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('role_id', 2);
    expect(response.body).toHaveProperty('role_name', 'Senior Sales Manager');
    expect(response.body).toHaveProperty('role_description', 'Manage sales team, view reports, and approve quotations');
    expect(response.body).toHaveProperty('is_active', true);
    
    // Verify role was actually updated
    const updatedRole = await request(app).get('/roles/2');
    expect(updatedRole.body.role_name).toBe('Senior Sales Manager');
  });
  
  // Test PUT role - not found
  test('PUT /roles/:id - should return 404 for non-existent role', async () => {
    const updatedData = {
      role_name: 'Updated Role'
    };
    
    const response = await request(app)
      .put('/roles/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Role not found');
  });
  
  // Test DELETE role
  test('DELETE /roles/:id - should delete a role without users', async () => {
    const response = await request(app).delete('/roles/4'); // Architect role (no users assigned)
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Role deleted successfully');
    
    // Verify role was actually deleted
    const deletedRole = await request(app).get('/roles/4');
    expect(deletedRole.status).toBe(404);
    
    const allRoles = await request(app).get('/roles');
    expect(allRoles.body.length).toBe(4);
  });
  
  // Test DELETE role with users
  test('DELETE /roles/:id - should return 400 for role with assigned users', async () => {
    const response = await request(app).delete('/roles/1'); // Admin role (has users)
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete role with assigned users');
  });
  
  // Test DELETE role - not found
  test('DELETE /roles/:id - should return 404 for non-existent role', async () => {
    const response = await request(app).delete('/roles/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Role not found');
  });
  
  // Test GET active roles only
  test('GET /roles/active - should return only active roles', async () => {
    const response = await request(app).get('/roles/active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4); // All except the inactive role
    response.body.forEach(role => {
      expect(role.is_active).toBe(true);
    });
  });
  
  // Test GET role permissions
  test('GET /roles/:id/permissions - should return permissions for a role', async () => {
    const response = await request(app).get('/roles/3/permissions'); // Sales Executive
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // Sales Executive has 3 permissions
    
    const permissionNames = response.body.map(perm => perm.permission_name);
    expect(permissionNames).toContain('view_leads');
    expect(permissionNames).toContain('create_leads');
    expect(permissionNames).toContain('edit_leads');
  });
  
  // Test assign permissions to role
  test('POST /roles/:id/permissions - should assign permissions to a role', async () => {
    const permissionData = {
      permission_ids: [8, 9] // view_projects, create_projects
    };
    
    const response = await request(app)
      .post('/roles/3/permissions')
      .send(permissionData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Permissions assigned successfully');
    expect(response.body).toHaveProperty('assigned_count', 2);
    
    // Verify permissions were assigned
    const rolePermissions = await request(app).get('/roles/3/permissions');
    expect(rolePermissions.body.length).toBe(5); // Now has 5 permissions
  });
  
  // Test remove permission from role
  test('DELETE /roles/:id/permissions/:permissionId - should remove permission from role', async () => {
    const response = await request(app).delete('/roles/2/permissions/8'); // Remove view_projects from Sales Manager
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Permission removed successfully');
    
    // Verify permission was removed
    const rolePermissions = await request(app).get('/roles/2/permissions');
    const permissionNames = rolePermissions.body.map(perm => perm.permission_name);
    expect(permissionNames).not.toContain('view_projects');
  });
  
  // Test GET users with role
  test('GET /roles/:id/users - should return users assigned to a role', async () => {
    const response = await request(app).get('/roles/1/users'); // Admin role
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('username', 'john_admin');
    expect(response.body[0]).toHaveProperty('email', 'john@company.com');
  });
  
  // Test role search
  test('GET /roles/search - should search roles by name', async () => {
    const response = await request(app).get('/roles/search?query=sales');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); // Sales Manager and Sales Executive
    
    const roleNames = response.body.map(role => role.role_name);
    expect(roleNames).toContain('Sales Manager');
    expect(roleNames).toContain('Sales Executive');
  });
  
  // Test toggle role status
  test('PUT /roles/:id/toggle-status - should toggle role active status', async () => {
    // First get current status
    const currentRole = await request(app).get('/roles/5');
    expect(currentRole.body.is_active).toBe(false);
    
    // Toggle status
    const response = await request(app).put('/roles/5/toggle-status');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('role_id', 5);
    expect(response.body).toHaveProperty('is_active', true); // Was false, now true
    
    // Toggle again
    const response2 = await request(app).put('/roles/5/toggle-status');
    expect(response2.body.is_active).toBe(false); // Back to false
  });
  
  // Test clone role
  test('POST /roles/:id/clone - should create a copy of a role with its permissions', async () => {
    const cloneData = {
      new_role_name: 'Sales Manager Copy',
      new_role_description: 'Cloned from Sales Manager role'
    };
    
    const response = await request(app)
      .post('/roles/2/clone')
      .send(cloneData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('role_name', 'Sales Manager Copy');
    expect(response.body).toHaveProperty('role_description', 'Cloned from Sales Manager role');
    expect(response.body).toHaveProperty('permissions');
    expect(response.body.permissions.length).toBe(5); // Same permissions as Sales Manager
  });
});
