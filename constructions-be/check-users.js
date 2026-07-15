const { Pool } = require('pg');
require('dotenv').config();

async function checkUsers() {
  console.log('Checking users in database...\n');
  
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  try {
    const db = new Pool(dbConfig);
    
    // Check if users table exists
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('Users table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Get all users
      const users = await db.query('SELECT id, username, email, first_name, last_name, is_active FROM users');
      console.log('Found users:');
      console.table(users.rows);
      
      // Test each user with common passwords
      const commonPasswords = ['admin123', 'admin', 'password', 'test123', '123456'];
      
      for (const user of users.rows) {
        console.log(`\nTesting passwords for user: ${user.username}`);
        for (const password of commonPasswords) {
          try {
            const authTest = await db.query(
              'SELECT id, username FROM users WHERE username = $1 AND password = $2',
              [user.username, password]
            );
            
            if (authTest.rows.length > 0) {
              console.log(`✅ Working credential: ${user.username} / ${password}`);
              break;
            }
          } catch (err) {
            console.log(`Error testing ${user.username}/${password}:`, err.message);
          }
        }
      }
    } else {
      console.log('❌ Users table does not exist. Run the setup SQL first.');
    }
    
    await db.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

checkUsers();
