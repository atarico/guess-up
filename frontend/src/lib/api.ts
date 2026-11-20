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

// The sleeping server (03 §8). Render's free instance sleeps after 15 minutes without traffic and
// takes up to a minute to wake. Every call goes through `answerOf`, so every screen waits the same way.

/** After this long without an answer, the waking screen shows and /status is asked. */
const WAKING_AFTER_MS = 3_000;
/** How often /status is asked while a call waits. */
const STATUS_EVERY_MS = 3_000;
/** A call never waits longer: then it fails, and the screen shows the generic error with its retry. */
const GIVE_UP_AFTER_MS = 90_000;

// How many calls have waited longer than WAKING_AFTER_MS; ServerWaking shows while it is above zero.
let waitingCalls = 0;
const wakingListeners = new Set<() => void>();

/** For ServerWaking: called whenever the waking screen should show or hide. */
export function subscribeWaking(listener: () => void): () => void {
  wakingListeners.add(listener);
  return () => {
    wakingListeners.delete(listener);
  };
}

export function isWaking(): boolean {
  return waitingCalls > 0;
}

function changeWaiting(by: 1 | -1) {
  waitingCalls += by;
  wakingListeners.forEach((listener) => listener());
}

/**
 * A 502, 503 or 504 that our API did not send: the server never got the request, so sending it
 * again is safe. Our own errors carry `error.code`; `503 NO_DATA` is ours and is delivered (03 §8).
 */
async function notServed(res: Response): Promise<boolean> {
  if (![502, 503, 504].includes(res.status)) return false;
  try {
    const body = (await res.clone().json()) as { error?: { code?: unknown } };
    return typeof body.error?.code !== 'string';
  } catch {
    return true;
  }
}

/**
 * Sends one request and settles once, with the server's answer (03 §8). After 3 s without one, the
 * waking screen shows and /status is asked every 3 s, one request at a time: Render holds a request
 * while it wakes, so /status answers late rather than never. The original request stays in flight,
 * and its answer ends the wait even if /status never answers. A request that was not served (a
 * network error, or a 5xx that is not ours) is sent again once /status says `db: true`.
 * `db: false` ends the wait with the generic error (decision 8), and so do 90 s without an answer.
 */
function answerOf(url: string, init: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    let done = false;
    let shown = false;
    let sendAgain = false;
    let askingStatus = false;
    let statusTimer: ReturnType<typeof setInterval> | undefined;

    function finish(settle: () => void) {
      if (done) return;
      done = true;
      clearTimeout(showTimer);
      clearTimeout(giveUpTimer);
      clearInterval(statusTimer);
      if (shown) changeWaiting(-1);
      settle();
    }

    function fail(code: 'NETWORK' | 'INTERNAL') {
      // Drops whatever is still in flight, so a late answer is never delivered.
      controller.abort();
      finish(() => reject(new ApiError(code)));
    }

    async function send() {
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        if (await notServed(res)) sendAgain = true;
        else finish(() => resolve(res));
      } catch {
        // A network error. (After `fail`, the abort lands here too, and nothing reads the flag.)
        sendAgain = true;
      }
    }

    async function askStatus() {
      if (askingStatus || done) return;
      askingStatus = true;
      try {
        const res = await fetch(`${API_URL}${HEALTH_PATH}`, { signal: controller.signal });
        const status = res.ok ? ((await res.json()) as { db?: unknown }) : null;
        if (status?.db === false) {
          fail('INTERNAL');
        } else if (status?.db === true && sendAgain && !done) {
          sendAgain = false;
          void send();
        }
      } catch {
        // Not awake yet: the next tick asks again.
      } finally {
        askingStatus = false;
      }
    }

    const showTimer = setTimeout(() => {
      shown = true;
      changeWaiting(1);
      void askStatus();
      statusTimer = setInterval(() => void askStatus(), STATUS_EVERY_MS);
    }, WAKING_AFTER_MS);
    const giveUpTimer = setTimeout(() => fail('NETWORK'), GIVE_UP_AFTER_MS);
    void send();
  });
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
 * the caller passes one, the wait for a sleeping server (`answerOf`), and every failure turned
 * into an ApiError with a code to map to copy.
 */
export async function api<T>(path: string, { method = 'GET', body, token }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await answerOf(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
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
