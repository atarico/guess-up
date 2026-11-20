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
  const pool = new pg.Pool({ connectionString, ssl: { ca }, max: 5 });
  // The pooler can drop idle connections. Without this listener that error would crash the process.
  pool.on('error', (err) => {
    console.error('Idle database client error:', err.message);
  });
  return pool;
}
