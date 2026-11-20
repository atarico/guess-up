import { readFileSync } from 'node:fs';
import pg from 'pg';

/**
 * Postgres pool for Supabase's Session pooler (02 §3).
 * TLS checks the server against Supabase's root certificate, committed in backend/certs,
 * instead of accepting any certificate. DATABASE_URL must not carry `sslmode`:
 * pg lets the connection string override this `ssl` option.
 */
export function createPool(connectionString: string): pg.Pool {
  const ca = readFileSync(new URL('../certs/supabase-ca.crt', import.meta.url), 'utf8');
  const pool = new pg.Pool({
    connectionString,
    ssl: { ca },
    max: 5,
    // General bounds, so a database that never answers cannot hang a request forever.
    // Generous on purpose: the seed writes about 5,000 rows per symbol in one transaction.
    // The health check has its own, much shorter deadline (routes/health.ts).
    connectionTimeoutMillis: 10_000,
    query_timeout: 30_000,
  });
  // The pooler can drop idle connections. Without this listener that error would crash the process.
  pool.on('error', (err) => {
    console.error('Idle database client error:', err.message);
  });
  return pool;
}
