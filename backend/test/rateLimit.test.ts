import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { fakeDeps } from './fakeDeps.js';

const LIMIT = 20;
// An invalid body still counts as an attempt, and it skips bcrypt, which keeps these tests fast.
const INVALID = { email: 'not-an-email', password: 'x' };

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('rate limit on register and login (02 §4)', () => {
  it('lets 20 attempts through, shared by both routes, and answers the 21st with 429 RATE_LIMITED', async () => {
    const app = createApp(fakeDeps());
    for (let i = 0; i < LIMIT; i++) {
      const path = i % 2 === 0 ? '/auth/register' : '/auth/login';
      expect((await request(app).post(path).send(INVALID)).status).toBe(400);
    }

    const blocked = await request(app).post('/auth/login').send(INVALID);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } });
    expect(blocked.headers['retry-after']).toEqual(expect.any(String));
    expect((await request(app).post('/auth/register').send(INVALID)).status).toBe(429);
  });

  it('sends the standard headers: the policy and the attempts left', async () => {
    const app = createApp(fakeDeps());
    const first = await request(app).post('/auth/login').send(INVALID);
    expect(first.headers['ratelimit-policy']).toContain('q=20');
    expect(first.headers['ratelimit-policy']).toContain('w=900');
    expect(first.headers['ratelimit']).toContain('r=19');
    expect(first.headers['x-ratelimit-remaining']).toBeUndefined();
  });

  it('does not count or limit GET /auth/me', async () => {
    const app = createApp(fakeDeps());
    for (let i = 0; i <= LIMIT; i++) await request(app).post('/auth/login').send(INVALID);

    const me = await request(app).get('/auth/me');
    expect(me.status).toBe(401);
    expect(me.body.error.code).toBe('UNAUTHORIZED');
    expect(me.headers['ratelimit']).toBeUndefined();
  });

  it('answers the 429 with CORS headers, so the browser lets the page read it', async () => {
    const app = createApp(fakeDeps());
    for (let i = 0; i < LIMIT; i++) await request(app).post('/auth/login').send(INVALID);

    const blocked = await request(app).post('/auth/login').set('Origin', 'http://localhost:3000').send(INVALID);
    expect(blocked.status).toBe(429);
    expect(blocked.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });
});

describe('TRUST_PROXY_HOPS', () => {
  const from = (app: ReturnType<typeof createApp>, forwardedFor: string) =>
    request(app).post('/auth/login').set('X-Forwarded-For', forwardedFor).send(INVALID);

  it('with 1 hop, two visitors behind the same proxy get separate counters', async () => {
    const app = createApp(fakeDeps({ trustProxyHops: 1 }));
    for (let i = 0; i < LIMIT; i++) await from(app, '198.51.100.1');

    expect((await from(app, '198.51.100.1')).status).toBe(429);
    const other = await from(app, '198.51.100.2');
    expect(other.status).toBe(400);
    expect(other.headers['ratelimit']).toContain('r=19');
  });

  it('with 0 hops, a forwarded header does not change who is counted', async () => {
    // express-rate-limit warns once about the unexpected header; that is the point of leaving 0 unset.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = createApp(fakeDeps({ trustProxyHops: 0 }));
    for (let i = 0; i < LIMIT; i++) await from(app, `198.51.100.${i}`);

    expect((await from(app, '203.0.113.9')).status).toBe(429);
  });
});
