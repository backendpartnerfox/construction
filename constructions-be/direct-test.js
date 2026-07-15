// direct-test.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'nopassword',
  host: 'localhost',
  port: 5432,
  database: 'testdb2'
});

async function runTest() {
  console.log('Testing database connection...');
  
  try {
    // Test connection
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ Database connected successfully');
    
    // Create tables
    console.log('Creating test tables...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
      )
    `);
    
    console.log('✅ Tables created');
    
    // Insert data
    await pool.query(`
      INSERT INTO test_table (name) VALUES ('Test Entry')
    `);
    
    console.log('✅ Data inserted');
    
    // Query data
    const data = await pool.query('SELECT * FROM test_table');
    console.log('✅ Data retrieved:', data.rows);
    
    // Cleanup
    await pool.query('DROP TABLE IF EXISTS test_table');
    console.log('✅ Cleanup complete');
    
    console.log('\n🎉 All tests passed! Your database is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === '3D000') {
      console.log('\n💡 Database "testdb2" does not exist.');
      console.log('Create it by connecting to PostgreSQL and running:');
      console.log('CREATE DATABASE testdb2;');
    }
  } finally {
    await pool.end();
  }
}

runTest();
