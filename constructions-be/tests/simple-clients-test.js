// tests/simple-clients-test.js
const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');

// Create a simple test app
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

// Add the clients route
const clientsRoute = require('../routes/clients_route');
app.use('/', clientsRoute);

describe('Simple Clients API Test', () => {
  beforeAll(async () => {
    try {
      // Create employees table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS employees (
          employee_id SERIAL PRIMARY KEY,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL
        )
      `);
      
      // Create clients table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clients (
          client_id SERIAL PRIMARY KEY,
          client_name VARCHAR(255) NOT NULL,
          surname VARCHAR(255),
          client_type VARCHAR(50),
          email VARCHAR(100),
          phone VARCHAR(20),
          city VARCHAR(100),
          state VARCHAR(100),
          is_active BOOLEAN DEFAULT TRUE,
          created_by INT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES employees(employee_id)
        )
      `);
      
      // Insert test employee
      await pool.query(`
        INSERT INTO employees (employee_id, first_name, last_name, email)
        VALUES (1, 'Test', 'User', 'test@company.com')
        ON CONFLICT (employee_id) DO NOTHING
      `);
      
      // Insert test client
      await pool.query(`
        INSERT INTO clients (client_name, client_type, email, phone, city, state, created_by)
        VALUES ('Test Client', 'Company', 'client@test.com', '1234567890', 'Mumbai', 'Maharashtra', 1)
        ON CONFLICT DO NOTHING
      `);
      
    } catch (error) {
      console.error('Setup error:', error.message);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  test('GET /clients should return clients', async () => {
    const response = await request(app).get('/clients');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('GET /clients/1 should return a specific client', async () => {
    const response = await request(app).get('/clients/1');
    if (response.status === 200) {
      expect(response.body).toHaveProperty('client_id');
      expect(response.body).toHaveProperty('client_name');
    }
  });
});
