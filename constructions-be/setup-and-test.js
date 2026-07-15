const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

async function setupAndTest() {
  console.log('🚀 Setting up database and testing login...\n');
  
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  try {
    const db = new Pool(dbConfig);
    
    console.log('📋 Step 1: Creating tables...');
    
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create user_sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    
    console.log('✅ Tables created successfully');
    
    console.log('👤 Step 2: Creating test users...');
    
    // Insert admin user
    await db.query(`
      INSERT INTO users (username, password, email, first_name, last_name, is_active) 
      VALUES ('admin', 'admin123', 'admin@construction.com', 'System', 'Admin', TRUE)
      ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password
    `);
    
    // Insert test user  
    await db.query(`
      INSERT INTO users (username, password, email, first_name, last_name, is_active) 
      VALUES ('testuser', 'test123', 'test@construction.com', 'Test', 'User', TRUE)
      ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password
    `);
    
    console.log('✅ Users created successfully');
    
    // Verify users exist
    const users = await db.query('SELECT id, username, email, is_active FROM users');
    console.log('📋 Current users:');
    console.table(users.rows);
    
    await db.end();
    
    // Wait a moment for any server restart
    console.log('⏳ Waiting 2 seconds for server...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔐 Step 3: Testing login API...');
    
    const testCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'testuser', password: 'test123' }
    ];
    
    for (const creds of testCredentials) {
      try {
        console.log(`Testing: ${creds.username}/${creds.password}`);
        
        const response = await axios.post('http://localhost:8000/api/user-sessions/login', {
          username: creds.username,
          password: creds.password,
          ip_address: '127.0.0.1',
          user_agent: 'Setup Test Script'
        }, {
          timeout: 5000
        });
        
        console.log('✅ Login successful!');
        console.log('User:', response.data.user);
        console.log('Token:', response.data.session?.token ? '***' + response.data.session.token.slice(-8) : 'No token');
        console.log('---');
        
      } catch (error) {
        if (error.response) {
          console.log('❌ Login failed:', error.response.status, error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
          console.log('❌ Cannot connect to backend - make sure it\'s running on port 8000');
        } else {
          console.log('❌ Error:', error.message);
        }
        console.log('---');
      }
    }
    
    console.log('🎉 Setup complete! You can now:');
    console.log('1. Go to http://localhost:8989/connection-test');
    console.log('2. Try login with: admin / admin123');
    console.log('3. Or go directly to: http://localhost:8989/login');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupAndTest();
