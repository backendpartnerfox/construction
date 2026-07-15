// tests/simple-db-test.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'nopassword',
  host: 'localhost',
  port: 5432,
  database: 'testdb2'
});

describe('Database Connection', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('should connect to testdb2', async () => {
    const result = await pool.query('SELECT 1 as test');
    expect(result.rows[0].test).toBe(1);
  });
});
