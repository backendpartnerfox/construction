// tests/clients_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Drop existing tables to ensure clean state
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.query('DROP TABLE IF EXISTS clients CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE clients (
      client_id SERIAL PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL,
      surname VARCHAR(255),
      client_type VARCHAR(50) CHECK (client_type IN ('Individual', 'Company', 'Government', 'Institution')),
      primary_contact_name VARCHAR(100),
      whatsppnumber VARCHAR(10),
      primary_contact_title VARCHAR(10),
      email VARCHAR(100),
      phone VARCHAR(20),
      alternative_phone VARCHAR(10),
      address_line1 VARCHAR(255),
      address_line2 VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(100) DEFAULT 'India',
      gst_number VARCHAR(50),
      pan_number VARCHAR(50),
      business_registration_number VARCHAR(50),
      client_category VARCHAR(50),
      referred_by VARCHAR(100),
      credit_limit DECIMAL(15,2),
      payment_terms VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      notes TEXT,
      profile_image_url VARCHAR(255),
      documents_path VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by INT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by INT,
      FOREIGN KEY (created_by) REFERENCES employees(employee_id),
      FOREIGN KEY (updated_by) REFERENCES employees(employee_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      client_id INT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(client_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.query('DROP TABLE IF EXISTS clients');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM projects');
  await pool.query('DELETE FROM clients');
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@company.com'),
      (2, 'Jane', 'Smith', 'jane.smith@company.com')
  `);
  
  await pool.query(`
    INSERT INTO clients (client_id, client_name, surname, client_type, email, phone, city, state, is_active, created_by)
    VALUES 
      (1, 'Rahul', 'Sharma', 'Individual', 'rahul@example.com', '9876543210', 'Mumbai', 'Maharashtra', true, 1),
      (2, 'ABC Corporation', NULL, 'Company', 'info@abccorp.com', '9876543211', 'Delhi', 'Delhi', true, 1),
      (3, 'XYZ Ltd', NULL, 'Company', 'contact@xyzltd.com', '9876543212', 'Bangalore', 'Karnataka', false, 1),
      (4, 'Government Agency', NULL, 'Government', 'gov@agency.com', '9876543213', 'Chennai', 'Tamil Nadu', true, 2)
  `);
  
  await pool.query(`
    INSERT INTO projects (project_id, project_name, client_id)
    VALUES 
      (1, 'Project Alpha', 1),
      (2, 'Project Beta', 1)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('clients_client_id_seq', 4)");
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
});

describe('Clients API', () => {
  // Test GET all clients
  test('GET /clients - should return all clients', async () => {
    const response = await request(app).get('/clients');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('client_id');
    expect(response.body[0]).toHaveProperty('client_name');
    expect(response.body[0]).toHaveProperty('client_type');
    expect(response.body[0]).toHaveProperty('email');
    expect(response.body[0]).toHaveProperty('is_active');
    
    // Check specific client
    const rahul = response.body.find(client => client.client_name === 'Rahul');
    expect(rahul).toBeDefined();
    expect(rahul.surname).toBe('Sharma');
    expect(rahul.client_type).toBe('Individual');
    expect(rahul.city).toBe('Mumbai');
  });
  
  // Test GET client by ID
  test('GET /clients/:id - should return a specific client', async () => {
    const response = await request(app).get('/clients/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('client_id', 1);
    expect(response.body).toHaveProperty('client_name', 'Rahul');
    expect(response.body).toHaveProperty('surname', 'Sharma');
    expect(response.body).toHaveProperty('client_type', 'Individual');
    expect(response.body).toHaveProperty('email', 'rahul@example.com');
    expect(response.body).toHaveProperty('phone', '9876543210');
    expect(response.body).toHaveProperty('city', 'Mumbai');
    expect(response.body).toHaveProperty('state', 'Maharashtra');
    expect(response.body).toHaveProperty('is_active', true);
  });
  
  // Test GET client by ID - not found
  test('GET /clients/:id - should return 404 for non-existent client', async () => {
    const response = await request(app).get('/clients/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Client not found');
  });
  
  // Test POST new client
  test('POST /clients - should create a new client', async () => {
    const newClient = {
      client_name: 'Priya',
      surname: 'Patel',
      client_type: 'Individual',
      primary_contact_name: 'Priya Patel',
      whatsppnumber: '9876543214',
      email: 'priya@example.com',
      phone: '9876543214',
      address_line1: '123 Main Street',
      city: 'Pune',
      state: 'Maharashtra',
      postal_code: '411001',
      gst_number: 'GST123456',
      pan_number: 'ABCDE1234F',
      credit_limit: 100000,
      payment_terms: 'Net 30',
      notes: 'Premium client',
      created_by: 1
    };
    
    const response = await request(app)
      .post('/clients')
      .send(newClient);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('client_id', 5);
    expect(response.body).toHaveProperty('client_name', 'Priya');
    expect(response.body).toHaveProperty('surname', 'Patel');
    expect(response.body).toHaveProperty('client_type', 'Individual');
    expect(response.body).toHaveProperty('email', 'priya@example.com');
    expect(response.body).toHaveProperty('city', 'Pune');
    expect(response.body).toHaveProperty('gst_number', 'GST123456');
    expect(response.body).toHaveProperty('is_active', true);
    
    // Verify client was actually created
    const allClients = await request(app).get('/clients');
    expect(allClients.body.length).toBe(5);
  });
  
  // Test POST client - missing required fields
  test('POST /clients - should return 400 for missing client name', async () => {
    const incompleteClient = {
      client_type: 'Individual',
      email: 'test@example.com'
    };
    
    const response = await request(app)
      .post('/clients')
      .send(incompleteClient);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Client name is required');
  });
  
  // Test PUT update client
  test('PUT /clients/:id - should update a client', async () => {
    const updatedData = {
      client_name: 'Rahul Kumar',
      surname: 'Sharma',
      client_type: 'Individual',
      email: 'rahul.kumar@example.com',
      phone: '9876543210',
      city: 'Mumbai',
      state: 'Maharashtra',
      notes: 'Updated information',
      updated_by: 2
    };
    
    const response = await request(app)
      .put('/clients/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('client_id', 1);
    expect(response.body).toHaveProperty('client_name', 'Rahul Kumar');
    expect(response.body).toHaveProperty('email', 'rahul.kumar@example.com');
    expect(response.body).toHaveProperty('notes', 'Updated information');
    expect(response.body).toHaveProperty('updated_by', 2);
  });
  
  // Test PUT client - missing required fields
  test('PUT /clients/:id - should return 400 for missing client name', async () => {
    const incompleteClient = {
      client_type: 'Individual',
      email: 'test@example.com'
    };
    
    const response = await request(app)
      .put('/clients/1')
      .send(incompleteClient);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Client name is required');
  });
  
  // Test PUT client - not found
  test('PUT /clients/:id - should return 404 for non-existent client', async () => {
    const updatedData = {
      client_name: 'Non-existent Client',
      client_type: 'Individual'
    };
    
    const response = await request(app)
      .put('/clients/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Client not found');
  });
  
  // Test DELETE client
  test('DELETE /clients/:id - should delete a client without projects', async () => {
    const response = await request(app).delete('/clients/2'); // ABC Corporation (no projects)
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Client deleted successfully');
    
    // Verify client was actually deleted
    const deletedClient = await request(app).get('/clients/2');
    expect(deletedClient.status).toBe(404);
    
    const allClients = await request(app).get('/clients');
    expect(allClients.body.length).toBe(3);
  });
  
  // Test DELETE client - not found
  test('DELETE /clients/:id - should return 404 for non-existent client', async () => {
    const response = await request(app).delete('/clients/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Client not found');
  });
  
  // Test GET clients by type
  test('GET /clients/type/:clientType - should return clients of specific type', async () => {
    const response = await request(app).get('/clients/type/Company');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('client_type', 'Company');
    expect(response.body[1]).toHaveProperty('client_type', 'Company');
    
    // Check client names
    const clientNames = response.body.map(client => client.client_name);
    expect(clientNames).toContain('ABC Corporation');
    expect(clientNames).toContain('XYZ Ltd');
  });
  
  // Test search clients
  test('GET /clients/search - should search clients by name, email, or phone', async () => {
    const response = await request(app).get('/clients/search?query=rahul');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('client_name', 'Rahul');
    
    // Search by email
    const emailResponse = await request(app).get('/clients/search?query=abccorp');
    expect(emailResponse.status).toBe(200);
    expect(emailResponse.body.length).toBe(1);
    expect(emailResponse.body[0]).toHaveProperty('client_name', 'ABC Corporation');
    
    // Search by phone
    const phoneResponse = await request(app).get('/clients/search?query=9876543210');
    expect(phoneResponse.status).toBe(200);
    expect(phoneResponse.body.length).toBe(1);
    expect(phoneResponse.body[0]).toHaveProperty('client_name', 'Rahul');
  });
  
  // Test search clients - missing query
  test('GET /clients/search - should return 400 for missing query', async () => {
    const response = await request(app).get('/clients/search');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Search query is required');
  });
  
  // Test GET active clients
  test('GET /clients/active - should return only active clients', async () => {
    const response = await request(app).get('/clients/active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    response.body.forEach(client => {
      expect(client.is_active).toBe(true);
    });
    
    // Verify inactive client is not included
    const clientNames = response.body.map(client => client.client_name);
    expect(clientNames).not.toContain('XYZ Ltd');
  });
  
  // Test GET clients by location
  test('GET /clients/location/:city - should return clients in specific city', async () => {
    const response = await request(app).get('/clients/location/Mumbai');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('client_name', 'Rahul');
    expect(response.body[0]).toHaveProperty('city', 'Mumbai');
    
    // Test partial match
    const partialResponse = await request(app).get('/clients/location/bang');
    expect(partialResponse.status).toBe(200);
    expect(partialResponse.body.length).toBe(1);
    expect(partialResponse.body[0]).toHaveProperty('city', 'Bangalore');
  });
});
