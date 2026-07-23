/*
 * One-time migration: hash every existing plaintext password in `users`
 * using bcrypt. Skips rows whose password already looks like a bcrypt hash
 * (starts with $2a$ / $2b$ / $2y$ and is 60 chars).
 *
 * Safe to re-run — idempotent by design.
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BCRYPT_ROUNDS = 10;

function looksLikeBcrypt(s) {
  return typeof s === 'string' && s.length === 60 && /^\$2[aby]\$/.test(s);
}

async function main() {
  const client = new Client({
    host: process.env.DB_HOST, user: process.env.DB_USER, port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await client.connect();
  try {
    const users = (await client.query('SELECT id, username, password FROM users ORDER BY id')).rows;
    let hashed = 0, skipped = 0;
    for (const u of users) {
      if (looksLikeBcrypt(u.password)) { skipped++; continue; }
      const hash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
      await client.query('UPDATE users SET password = $1 WHERE id = $2', [hash, u.id]);
      hashed++;
      console.log(`hashed user ${u.id} (${u.username})`);
    }
    console.log(`\nDone. Hashed ${hashed} passwords, skipped ${skipped} already-hashed.`);
  } finally {
    await client.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
