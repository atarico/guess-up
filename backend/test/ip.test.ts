import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { fakeDeps } from './fakeDeps.js';

// Temporary endpoint; this file goes with it.
describe('GET /ip', () => {
  it('reports the socket address and no forwarded chain when there is no proxy', async () => {
    const res = await request(createApp(fakeDeps())).get('/ip');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ip: expect.stringContaining('127.0.0.1'), forwardedFor: null, forwardedCount: 0 });
  });

  it('reports the raw chain and its length, and req.ip as the trusted hops make it', async () => {
    const chain = '203.0.113.7, 198.51.100.1, 10.0.0.2';
    const untrusted = await request(createApp(fakeDeps())).get('/ip').set('X-Forwarded-For', chain);
    expect(untrusted.body).toEqual({ ip: expect.stringContaining('127.0.0.1'), forwardedFor: chain, forwardedCount: 3 });

    const trusted = await request(createApp(fakeDeps({ trustProxyHops: 3 }))).get('/ip').set('X-Forwarded-For', chain);
    expect(trusted.body.ip).toBe('203.0.113.7');
  });
});
