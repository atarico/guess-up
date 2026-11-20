import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, isWaking, subscribeWaking } from './api';

type Call = { url: string; init: RequestInit; resolve: (res: Response) => void; reject: (err: unknown) => void };

/** A fetch whose every request stays pending until the test answers it; an abort rejects it, as in a browser. */
function fakeFetch() {
  const calls: Call[] = [];
  const fn = vi.fn(
    (url: string, init: RequestInit = {}) =>
      new Promise<Response>((resolve, reject) => {
        calls.push({ url, init, resolve, reject });
        init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      }),
  );
  const isStatus = (call: Call) => call.url.endsWith('/status');
  return { fn, original: () => calls.filter((c) => !isStatus(c)), status: () => calls.filter(isStatus) };
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const apiError = (status: number, code: string) => json(status, { error: { code, message: 'x' } });
const serverUp = () => json(200, { ok: true, db: true });
const networkError = () => new TypeError('Failed to fetch');
/** Lets pending promise callbacks run without moving the clock. */
const settle = () => vi.advanceTimersByTimeAsync(0);
const advance = (ms: number) => vi.advanceTimersByTimeAsync(ms);

let net: ReturnType<typeof fakeFetch>;
let screen: boolean[];
let unsubscribe: () => void;

beforeEach(() => {
  // Only the timers and the clock: a Response body is still read with the real setImmediate.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  net = fakeFetch();
  vi.stubGlobal('fetch', net.fn);
  screen = [];
  unsubscribe = subscribeWaking(() => screen.push(isWaking()));
});

afterEach(() => {
  unsubscribe();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('api: the sleeping server (03 §8)', () => {
  it('an answer before 3 seconds: the waking screen never shows', async () => {
    const result = api('/stats', { token: 't' });
    await advance(2_900);
    net.original()[0].resolve(json(200, { rounds: 1 }));

    await expect(result).resolves.toEqual({ rounds: 1 });
    await advance(10_000);
    expect(screen).toEqual([]);
    expect(net.status()).toHaveLength(0);
  });

  it('an answer after 3 seconds: the screen shows, goes away, and the result arrives once, even if /status never answers', async () => {
    const delivered = vi.fn();
    void api('/stats', { token: 't' }).then(delivered);

    await advance(3_000);
    expect(isWaking()).toBe(true);
    await advance(7_000); // /status was asked and never answered: the original request still counts
    net.original()[0].resolve(json(200, { rounds: 1 }));
    await settle();

    expect(delivered).toHaveBeenCalledOnce();
    expect(delivered).toHaveBeenCalledWith({ rounds: 1 });
    expect(screen).toEqual([true, false]);
    await advance(100_000);
    expect(delivered).toHaveBeenCalledOnce();
    expect(net.original()).toHaveLength(1);
  });

  it('a network error, then /status answers: the request is sent again and succeeds', async () => {
    const result = api('/rounds', { method: 'POST', token: 't' });
    net.original()[0].reject(networkError());
    await advance(3_000);
    net.status()[0].resolve(serverUp());
    await settle();
    net.original()[1].resolve(json(200, { resumed: false }));

    await expect(result).resolves.toEqual({ resumed: false });
    expect(net.original()).toHaveLength(2);
    expect(screen).toEqual([true, false]);
  });

  it('a 502 without our error body counts as not served, and is sent again', async () => {
    const result = api('/stats', { token: 't' });
    net.original()[0].resolve(new Response('<html>Bad Gateway</html>', { status: 502 }));
    await advance(3_000);
    net.status()[0].resolve(serverUp());
    await settle();
    net.original()[1].resolve(json(200, { rounds: 2 }));

    await expect(result).resolves.toEqual({ rounds: 2 });
  });

  it('/status with db: false: the wait ends with the generic error', async () => {
    const result = api('/stats', { token: 't' });
    const failed = expect(result).rejects.toMatchObject({ code: 'INTERNAL' });
    await advance(3_000);
    net.status()[0].resolve(json(200, { ok: true, db: false }));

    await failed;
    expect(net.original()[0].init.signal?.aborted).toBe(true);
    expect(isWaking()).toBe(false);
  });

  it('past 90 seconds: the generic error, the screen gone, and no more requests', async () => {
    const started = Date.now();
    const result = api('/stats', { token: 't' });
    let failedAfter: number | null = null;
    result.catch(() => (failedAfter = Date.now() - started));
    const failed = expect(result).rejects.toEqual(new ApiError('NETWORK'));
    net.original()[0].reject(networkError());
    // Every /status answer is a network error too: the server never comes back.
    for (let tick = 0; tick < 29; tick++) {
      await advance(3_000);
      net.status().forEach((call) => call.reject(networkError()));
    }
    await advance(2_000);
    expect(failedAfter).toBeNull(); // still waiting at 89 s
    await advance(1_000);

    await failed;
    expect(failedAfter).toBe(90_000);
    expect(isWaking()).toBe(false);
    const requests = net.fn.mock.calls.length;
    await advance(60_000);
    expect(net.fn.mock.calls.length).toBe(requests);
  });

  it.each([
    [401, 'INVALID_CREDENTIALS'],
    [409, 'EMAIL_TAKEN'],
    [400, 'VALIDATION'],
    // 03 §8: our own 503 has its own message; it was served, so it is not retried.
    [503, 'NO_DATA'],
  ])('a %i answer passes through as it is, with no retry', async (status, code) => {
    const result = api('/auth/login', { method: 'POST', body: { email: 'a@b.c', password: 'x' } });
    net.original()[0].resolve(apiError(status, code));

    await expect(result).rejects.toEqual(new ApiError(code as ApiError['code']));
    await advance(100_000);
    expect(net.original()).toHaveLength(1);
    expect(net.status()).toHaveLength(0);
    expect(screen).toEqual([]);
  });
});
