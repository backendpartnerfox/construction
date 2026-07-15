// tests/employees.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE,
      phone VARCHAR(20),
      designation VARCHAR(100),
      department VARCHAR(100),
      joining_date DATE,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.end();
});

beforeEach(async () => {
  // Clear table before each test
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO employees (
      employee_id, first_name, last_name, email, phone, designation, department, joining_date, is_active
    )
    VALUES 
      (1, 'John', 'Doe', 'john.doe@example.com', '1234567890', 'Engineer', 'Construction', '2023-01-15', true),
      (2, 'Jane', 'Smith', 'jane.smith@example.com', '0987654321', 'Architect', 'Design', '2023-02-20', true)
  `);
  
  // Reset sequence
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
});

describe('Employees API', () => {
  // Test GET all employees
  test('GET /employees - should return all employees', async () => {
    const response = await request(app).get('/employees');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('first_name', 'John');
    expect(response.body[1]).toHaveProperty('first_name', 'Jane');
  });
  
  // Test GET employee by ID
  test('GET /employees/:id - should return a specific employee', async () => {
    const response = await request(app).get('/employees/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('employee_id', 1);
    expect(response.body).toHaveProperty('first_name', 'John');
    expect(response.body).toHaveProperty('last_name', 'Doe');
    expect(response.body).toHaveProperty('email', 'john.doe@example.com');
  });
  
  // Test GET employee by ID - not found
  test('GET /employees/:id - should return 404 for non-existent employee', async () => {
    const response = await request(app).get('/employees/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Employee not found');
  });
  
  // Test POST new employee
  test('POST /employees - should create a new employee', async () => {
    const newEmployee = {
      first_name: 'Robert',
      last_name: 'Johnson',
      email: 'robert.johnson@example.com',
      phone: '5551234567',
      designation: 'Project Manager',
      department: 'Management',
      joining_date: '2023-03-10',
      is_active: true
    };
    
    const response = await request(app)
      .post('/employees')
      .send(newEmployee);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('employee_id', 3);
    expect(response.body).toHaveProperty('first_name', 'Robert');
    expect(response.body).toHaveProperty('last_name', 'Johnson');
    expect(response.body).toHaveProperty('email', 'robert.johnson@example.com');
    
    // Verify employee was actually created
    const allEmployees = await request(app).get('/employees');
    expect(allEmployees.body.length).toBe(3);
  });
  
  // Test POST employee - missing required fields
  test('POST /employees - should return 400 for missing required fields', async () => {
    const incompleteEmployee = {
      email: 'incomplete@example.com',
      phone: '5551234567'
      // Missing first_name and last_name
    };
    
    const response = await request(app)
      .post('/employees')
      .send(incompleteEmployee);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test PUT update employee
  test('PUT /employees/:id - should update an employee', async () => {
    const updatedData = {
      first_name: 'Jonathan',
      last_name: 'Doe',
      email: 'jonathan.doe@example.com',
      phone: '5559876543',
      designation: 'Senior Engineer',
      department: 'Construction'
    };
    
    const response = await request(app)
      .put('/employees/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('employee_id', 1);
    expect(response.body).toHaveProperty('first_name', 'Jonathan');
    expect(response.body).toHaveProperty('designation', 'Senior Engineer');
    
    // Verify employee was actually updated
    const updatedEmployee = await request(app).get('/employees/1');
    expect(updatedEmployee.body.first_name).toBe('Jonathan');
    expect(updatedEmployee.body.email).toBe('jonathan.doe@example.com');
  });
  
  // Test PUT employee - not found
  test('PUT /employees/:id - should return 404 for non-existent employee', async () => {
    const updatedData = {
      first_name: 'Nobody',
      last_name: 'NoExist'
    };
    
    const response = await request(app)
      .put('/employees/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Employee not found');
  });
  
  // Test DELETE employee
  test('DELETE /employees/:id - should delete an employee', async () => {
    const response = await request(app).delete('/employees/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Employee deleted successfully');
    
    // Verify employee was actually deleted
    const deletedEmployee = await request(app).get('/employees/1');
    expect(deletedEmployee.status).toBe(404);
    
    const allEmployees = await request(app).get('/employees');
    expect(allEmployees.body.length).toBe(1);
  });
  
  // Test GET employees by department
  test('GET /employees/department/:department - should return employees by department', async () => {
    const response = await request(app).get('/employees/department/Construction');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('department', 'Construction');
    expect(response.body[0]).toHaveProperty('first_name', 'John');
  });
  
  // Test GET active employees
  test('GET /employees/active - should return only active employees', async () => {
    // First make one employee inactive
    await pool.query("UPDATE employees SET is_active = false WHERE employee_id = 2");
    
    const response = await request(app).get('/employees/active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('is_active', true);
    expect(response.body[0]).toHaveProperty('employee_id', 1);
  });
});