import { describe, expect, it } from 'vitest';
import { createPool } from '../src/db.js';

// No connection is opened: pg only connects on the first query.
const url = 'postgresql://user:pass@localhost:5432/db';

describe('createPool', () => {
  it('bounds connecting and querying, so a database that never answers cannot hang a request forever', async () => {
    const pool = createPool(url);
    expect(pool.options.connectionTimeoutMillis).toBe(10_000);
    expect(pool.options.query_timeout).toBe(30_000);
    await pool.end();
  });
});
