// tests/setup/createTestDb.js
const { Client } = require('pg');
require('dotenv').config({ path: '.env.test' });

async function createTestDatabase() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'nopassword',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres' // Connect to default database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');
    
    // Check if test database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'testdb2'"
    );
    
    if (res.rows.length === 0) {
      // Create test database
      await client.query('CREATE DATABASE testdb2');
      console.log('Test database "testdb2" created successfully');
    } else {
      console.log('Test database "testdb2" already exists');
    }
  } catch (error) {
    console.error('Error creating test database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  createTestDatabase()
    .then(() => {
      console.log('Test database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test database setup failed:', error);
      process.exit(1);
    });
}

module.exports = createTestDatabase;