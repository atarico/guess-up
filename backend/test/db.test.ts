import { describe, expect, it } from 'vitest';
import { createPool } from '../src/db.js';

// No connection is opened: pg only connects on the first query.
const url = 'postgresql://user:pass@localhost:5432/db';

describe('createPool and TLS', () => {
  it('verifies the server explicitly against the committed CA', async () => {
    const pool = createPool(url);
    const ssl = pool.options.ssl as { ca?: string; rejectUnauthorized?: boolean };
    expect(ssl.rejectUnauthorized).toBe(true);
    expect(ssl.ca).toContain('BEGIN CERTIFICATE');
    await pool.end();
  });

  it.each([
    ['sslmode=disable', 'sslmode'],
    ['ssl=0', 'ssl'],
    ['sslmode=no-verify', 'sslmode'],
    ['uselibpqcompat=true&sslmode=require', 'uselibpqcompat, sslmode'],
    ['sslrootcert=%2Ftmp%2Fother-ca.pem', 'sslrootcert'],
    ['sslmode=verify-full', 'sslmode'],
  ])('refuses a DATABASE_URL carrying %s, naming the parameter but not the URL or its values', (query, named) => {
    const withSsl = `postgresql://user:s3cret-pass@db.example.com:5432/db?${query}`;
    let message = '';
    try {
      createPool(withSsl);
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain(`must not carry SSL parameters (found: ${named})`);
    for (const leak of ['s3cret-pass', 'db.example.com', 'disable', 'no-verify', 'verify-full', 'other-ca']) {
      expect(message).not.toContain(leak);
    }
  });
});

describe('createPool', () => {
  it('bounds connecting and querying, so a database that never answers cannot hang a request forever', async () => {
    const pool = createPool(url);
    expect(pool.options.connectionTimeoutMillis).toBe(10_000);
    expect(pool.options.query_timeout).toBe(30_000);
    await pool.end();
  });
});
