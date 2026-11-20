import { readFileSync } from 'node:fs';
import { createPool } from '../db.js';

// Applies sql/001_init.sql in one transaction. Not idempotent on purpose: a second run
// fails on "already exists" and rolls back, so the schema is never half-applied.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add it to backend/.env.');
  process.exit(1);
}

const sql = readFileSync(new URL('../../sql/001_init.sql', import.meta.url), 'utf8');
const pool = createPool(databaseUrl);
const client = await pool.connect();
try {
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');
  console.log('Applied sql/001_init.sql');
} catch (err) {
  await client.query('rollback');
  console.error('Migration failed and was rolled back:', (err as Error).message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
