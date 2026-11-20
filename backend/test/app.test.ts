import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { fakeDeps } from './fakeDeps.js';

const app = createApp(fakeDeps());

describe('app', () => {
  it('answers an unknown route with 404 and the standard error shape', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  it('sends CORS headers only to a listed origin', async () => {
    const allowed = await request(app).get('/does-not-exist').set('Origin', 'http://localhost:3000');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');

    const other = await request(app).get('/does-not-exist').set('Origin', 'https://example.com');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});
