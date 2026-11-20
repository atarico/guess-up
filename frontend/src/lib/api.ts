import type { ErrorCode } from './api-types';
import { clearStoredToken } from './auth';

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Not `/health`: EasyPrivacy, which Brave Shields and uBlock Origin apply by default, blocks
// cross-site requests to onrender.com/health (DECISIONS.md). Must match HEALTH_PATH in the backend.
export const HEALTH_PATH = '/status';

/** The query string /login reads to show "Tu sesión expiró" (03 §8). */
export const SESSION_EXPIRED_QUERY = 'expired=1';

/** A failed call: the API's `error.code`, or `NETWORK` when no answer arrived. */
export class ApiError extends Error {
  readonly code: ErrorCode | 'NETWORK';

  constructor(code: ErrorCode | 'NETWORK') {
    super(code);
    this.name = 'ApiError';
    this.code = code;
  }
}

type Options = { method?: 'GET' | 'POST'; body?: unknown; token?: string };

/** The `error.code` of an error response; a body without one counts as a server failure. */
async function errorCodeOf(res: Response): Promise<ErrorCode> {
  try {
    const body = (await res.json()) as { error?: { code?: unknown } };
    if (typeof body.error?.code === 'string') return body.error.code as ErrorCode;
  } catch {
    // Not JSON: a proxy or the host answered instead of our API.
  }
  return 'INTERNAL';
}

/**
 * The one way the frontend calls the backend (03 §2): JSON in and out, the bearer token when
 * the caller passes one, and every failure turned into an ApiError with a code to map to copy.
 */
export async function api<T>(path: string, { method = 'GET', body, token }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('NETWORK');
  }
  if (res.ok) return (await res.json()) as T;

  const code = await errorCodeOf(res);
  if (code === 'UNAUTHORIZED' && token) {
    // The server rejected the token: forget it and log in again, with the notice (03 §7, §8).
    // A full load, so no component keeps the old token. The promise never settles, so the page
    // shows no error while the browser leaves it.
    clearStoredToken();
    window.location.replace(`/login?${SESSION_EXPIRED_QUERY}`);
    return new Promise<never>(() => {});
  }
  throw new ApiError(code);
}
