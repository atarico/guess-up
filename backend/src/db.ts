import { readFileSync } from 'node:fs';
import pg from 'pg';

/**
 * Names of the query parameters in a connection string that pg would let override the `ssl`
 * option below: `sslmode=disable` sends plaintext, `no-verify` accepts any certificate,
 * `require`/`verify-full` drop the pinned CA, `sslrootcert` swaps it. Values are never returned.
 */
function sslParameters(connectionString: string): string[] {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    // Node's own error would carry the input, so it is replaced.
    throw new Error('DATABASE_URL is not a valid URL.');
  }
  const names = [...url.searchParams.keys()].filter((name) => {
    const lower = name.toLowerCase();
    return lower.startsWith('ssl') || lower === 'uselibpqcompat';
  });
  return [...new Set(names)];
}

/**
 * The only way the server, the migration and the seed open Postgres connections (02 §3).
 * TLS checks the server against Supabase's root certificate, committed in backend/certs,
 * instead of accepting any certificate.
 */
export function createPool(connectionString: string): pg.Pool {
  const found = sslParameters(connectionString);
  if (found.length > 0) {
    throw new Error(
      `DATABASE_URL must not carry SSL parameters (found: ${found.join(', ')}). TLS is configured in src/db.ts.`,
    );
  }

  const ca = readFileSync(new URL('../certs/supabase-ca.crt', import.meta.url), 'utf8');
  const pool = new pg.Pool({
    connectionString,
    // Explicit, so NODE_TLS_REJECT_UNAUTHORIZED=0 in the environment cannot turn verification off.
    ssl: { ca, rejectUnauthorized: true },
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
