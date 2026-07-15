// tests/employees_route.test.js
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
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20),
      employee_code VARCHAR(20) UNIQUE,
      designation VARCHAR(100),
      department VARCHAR(100),
      role VARCHAR(50),
      reporting_manager_id INT,
      date_of_birth DATE,
      gender VARCHAR(10),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(100) DEFAULT 'India',
      status VARCHAR(20) CHECK (status IN ('Active', 'On Leave', 'Terminated', 'Resigned')),
      join_date DATE,
      termination_date DATE,
      username VARCHAR(50) UNIQUE,
      password_hash VARCHAR(255),
      last_login TIMESTAMP WITH TIME ZONE,
      salary DECIMAL(12,2),
      salary_currency VARCHAR(3) DEFAULT 'INR',
      document_ids TEXT[],
      profile_image_url VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporting_manager_id) REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM employees');
  
  // Insert test data with proper manager references
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email, phone, employee_code, 
                          designation, department, role, status, join_date)
    VALUES 
      (1, 'Rajesh', 'Kumar', 'rajesh.kumar@company.com', '9876543210', 'EMP001', 
       'CEO', 'Management', 'Executive', 'Active', '2020-01-15')
  `);
  
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email, phone, employee_code, 
                          designation, department, role, reporting_manager_id, status, join_date)
    VALUES 
      (2, 'Priya', 'Singh', 'priya.singh@company.com', '9876543211', 'EMP002', 
       'Project Manager', 'Projects', 'Manager', 1, 'Active', '2021-02-10'),
      (3, 'Anand', 'Sharma', 'anand.sharma@company.com', '9876543212', 'EMP003', 
       'Senior Architect', 'Design', 'Senior Staff', 1, 'Active', '2021-03-05'),
      (4, 'Deepa', 'Patel', 'deepa.patel@company.com', '9876543213', 'EMP004', 
       'Site Engineer', 'Engineering', 'Engineer', 2, 'On Leave', '2022-04-01')
  `);
  
  // Reset sequence
  await pool.query("SELECT setval('employees_employee_id_seq', 4)");
});

describe('Employees API', () => {
  // Test GET all employees
  test('GET /employees - should return all employees', async () => {
    const response = await request(app).get('/employees');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('employee_id');
    expect(response.body[0]).toHaveProperty('first_name');
    expect(response.body[0]).toHaveProperty('last_name');
    expect(response.body[0]).toHaveProperty('email');
    expect(response.body[0]).toHaveProperty('designation');
  });
  
  // Test GET employee by ID
  test('GET /employees/:id - should return a specific employee', async () => {
    const response = await request(app).get('/employees/2');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('employee_id', 2);
    expect(response.body).toHaveProperty('first_name', 'Priya');
    expect(response.body).toHaveProperty('last_name', 'Singh');
    expect(response.body).toHaveProperty('email', 'priya.singh@company.com');
    expect(response.body).toHaveProperty('employee_code', 'EMP002');
    expect(response.body).toHaveProperty('designation', 'Project Manager');
    expect(response.body).toHaveProperty('department', 'Projects');
    expect(response.body).toHaveProperty('reporting_manager_id', 1);
    expect(response.body).toHaveProperty('status', 'Active');
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
      first_name: 'Amit',
      last_name: 'Verma',
      email: 'amit.verma@company.com',
      phone: '9876543214',
      employee_code: 'EMP005',
      designation: 'Junior Engineer',
      department: 'Engineering',
      role: 'Engineer',
      reporting_manager_id: 2,
      status: 'Active',
      join_date: '2024-01-15',
      city: 'Mumbai',
      state: 'Maharashtra'
    };
    
    const response = await request(app)
      .post('/employees')
      .send(newEmployee);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('employee_id', 5);
    expect(response.body).toHaveProperty('first_name', 'Amit');
    expect(response.body).toHaveProperty('last_name', 'Verma');
    expect(response.body).toHaveProperty('email', 'amit.verma@company.com');
    expect(response.body).toHaveProperty('employee_code', 'EMP005');
    expect(response.body).toHaveProperty('status', 'Active');
    
    // Verify employee was actually created
    const allEmployees = await request(app).get('/employees');
    expect(allEmployees.body.length).toBe(5);
  });
  
  // Test POST employee - missing required fields
  test('POST /employees - should return 400 for missing required fields', async () => {
    const incompleteEmployee = {
      first_name: 'Test',
      email: 'test@company.com'
    };
    
    const response = await request(app)
      .post('/employees')
      .send(incompleteEmployee);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'First name, last name, and email are required');
  });
  
  // Test POST employee - duplicate email
  test('POST /employees - should return 409 for duplicate email', async () => {
    const duplicateEmployee = {
      first_name: 'Test',
      last_name: 'User',
      email: 'priya.singh@company.com', // Already exists
      employee_code: 'EMP999'
    };
    
    const response = await request(app)
      .post('/employees')
      .send(duplicateEmployee);
    
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('duplicate');
  });
  
  // Test PUT update employee
  test('PUT /employees/:id - should update an employee', async () => {
    const updatedData = {
      first_name: 'Priya',
      last_name: 'Singh-Kumar',
      email: 'priya.kumar@company.com',
      designation: 'Senior Project Manager',
      department: 'Projects',
      phone: '9876543999'
    };
    
    const response = await request(app)
      .put('/employees/2')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('employee_id', 2);
    expect(response.body).toHaveProperty('last_name', 'Singh-Kumar');
    expect(response.body).toHaveProperty('email', 'priya.kumar@company.com');
    expect(response.body).toHaveProperty('designation', 'Senior Project Manager');
    expect(response.body).toHaveProperty('phone', '9876543999');
  });
  
  // Test DELETE employee
  test('DELETE /employees/:id - should delete an employee', async () => {
    const response = await request(app).delete('/employees/4');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Employee deleted successfully');
    
    // Verify employee was actually deleted
    const deletedEmployee = await request(app).get('/employees/4');
    expect(deletedEmployee.status).toBe(404);
    
    const allEmployees = await request(app).get('/employees');
    expect(allEmployees.body.length).toBe(3);
  });
  
  // Test GET employees by department
  test('GET /employees/department/:department - should return employees in specific department', async () => {
    const response = await request(app).get('/employees/department/Engineering');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('first_name', 'Deepa');
    expect(response.body[0]).toHaveProperty('department', 'Engineering');
  });
  
  // Test GET active employees
  test('GET /employees/status/active - should return only active employees', async () => {
    const response = await request(app).get('/employees/status/active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    response.body.forEach(employee => {
      expect(employee.status).toBe('Active');
    });
    
    // Verify on leave employee is not included
    const employeeNames = response.body.map(emp => emp.first_name);
    expect(employeeNames).not.toContain('Deepa');
  });
  
  // Test GET employees by manager
  test('GET /employees/manager/:managerId - should return employees reporting to specific manager', async () => {
    const response = await request(app).get('/employees/manager/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(employee => {
      expect(employee.reporting_manager_id).toBe(1);
    });
  });
  
  // Test search employees
  test('GET /employees/search - should search employees by name or email', async () => {
    const response = await request(app).get('/employees/search?query=singh');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('last_name', 'Singh');
  });
});
