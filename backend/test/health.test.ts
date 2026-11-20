import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { fakeDeps } from './fakeDeps.js';

describe('GET /health', () => {
  it('reports the database, ready symbols and credits used today', async () => {
    const res = await request(createApp(fakeDeps())).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, db: true, symbolsReady: 3, credits: { usedToday: 5, dailyCap: 750 } });
  });

  it('still answers 200, with db: false and nothing else, when the database fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = fakeDeps({ db: { ping: () => Promise.reject(new Error('connection refused')) } });
    const res = await request(createApp(failing)).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, db: false });
  });
});
