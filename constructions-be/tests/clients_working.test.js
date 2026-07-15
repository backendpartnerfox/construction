// tests/clients_working.test.js
const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const clientsRoute = require('../routes/clients_route');

// Create test app
const app = express();
app.use(express.json());

// Create test database pool
const pool = new Pool({
  user: 'postgres',
  password: 'nopassword',
  host: 'localhost',
  port: 5432,
  database: 'testdb2'
});

// Add db to request
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Add routes
app.use('/', clientsRoute);

describe('Clients API', () => {
  beforeAll(async () => {
    // Create necessary tables if they don't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS employees (
          employee_id SERIAL PRIMARY KEY,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL
        )
      `);
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clients (
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
      
      // Insert test employee if not exists
      await pool.query(`
        INSERT INTO employees (employee_id, first_name, last_name, email)
        VALUES (1, 'Test', 'User', 'test@company.com')
        ON CONFLICT (employee_id) DO NOTHING
      `);
    } catch (error) {
      console.error('Setup error:', error.message);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM clients WHERE email LIKE $1', ['%test%']);
  });

  test('GET /clients - should return all clients', async () => {
    const response = await request(app).get('/clients');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('GET /clients/:id - should return a specific client or 404', async () => {
    const response = await request(app).get('/clients/1');
    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('client_id');
    }
  });

  test('POST /clients - should create a new client', async () => {
    const newClient = {
      client_name: 'Test Client ' + Date.now(),
      client_type: 'Company',
      email: 'test' + Date.now() + '@example.com',
      phone: '9999999999',
      city: 'Mumbai',
      state: 'Maharashtra',
      created_by: 1
    };
    
    const response = await request(app)
      .post('/clients')
      .send(newClient);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('client_id');
    expect(response.body).toHaveProperty('client_name', newClient.client_name);
    expect(response.body).toHaveProperty('email', newClient.email);
  });

  test('POST /clients - should return 400 for missing client name', async () => {
    const incompleteClient = {
      email: 'incomplete@example.com'
    };
    
    const response = await request(app)
      .post('/clients')
      .send(incompleteClient);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('PUT /clients/:id - should update a client', async () => {
    // First create a client
    const newClient = {
      client_name: 'Update Test Client',
      email: 'updatetest@example.com',
      created_by: 1
    };
    
    const createResponse = await request(app)
      .post('/clients')
      .send(newClient);
    
    const clientId = createResponse.body.client_id;
    
    // Now update it
    const updatedData = {
      client_name: 'Updated Client Name',
      email: 'updated@example.com',
      city: 'Delhi',
      updated_by: 1
    };
    
    const updateResponse = await request(app)
      .put(`/clients/${clientId}`)
      .send(updatedData);
    
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toHaveProperty('client_name', 'Updated Client Name');
    expect(updateResponse.body).toHaveProperty('city', 'Delhi');
  });

  test('DELETE /clients/:id - should delete a client', async () => {
    // First create a client
    const newClient = {
      client_name: 'Delete Test Client',
      email: 'deletetest@example.com',
      created_by: 1
    };
    
    const createResponse = await request(app)
      .post('/clients')
      .send(newClient);
    
    const clientId = createResponse.body.client_id;
    
    // Now delete it
    const deleteResponse = await request(app).delete(`/clients/${clientId}`);
    expect(deleteResponse.status).toBe(200);
    
    // Verify it's deleted
    const getResponse = await request(app).get(`/clients/${clientId}`);
    expect(getResponse.status).toBe(404);
  });

  test('GET /clients/search - should search clients', async () => {
    const response = await request(app).get('/clients/search?query=test');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('GET /clients/active - should return active clients', async () => {
    const response = await request(app).get('/clients/active');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    response.body.forEach(client => {
      expect(client.is_active).toBe(true);
    });
  });
});
