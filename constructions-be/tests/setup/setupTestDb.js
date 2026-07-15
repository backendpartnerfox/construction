// tests/setup/setupTestDb.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.test' });

async function setupTestDatabase() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'nopassword',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'testdb2'
  });

  try {
    await client.connect();
    console.log('✅ Connected to test database');
    
    // Read and execute the complete schema
    const schemaPath = path.join(__dirname, 'test-schema-complete.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📝 Creating database schema...');
    
    // Execute the schema
    await client.query(schema);
    
    console.log('✅ Test database schema created successfully');
    console.log('✅ All tables and basic test data inserted');
    
  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    
    // Provide more specific error information
    if (error.message.includes('does not exist')) {
      console.error('💡 Make sure the test database "testdb2" exists');
      console.error('   Run: npm run test:setup');
    } else if (error.message.includes('permission denied')) {
      console.error('💡 Check database user permissions');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Make sure PostgreSQL is running');
    }
    
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  setupTestDatabase()
    .then(() => {
      console.log('✨ Test database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test database setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupTestDatabase;
