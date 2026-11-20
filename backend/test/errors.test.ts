import { inspect } from 'node:util';
import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { errorHandler } from '../src/middleware/errors.js';
import { fakeDeps } from './fakeDeps.js';

// Something a client could have typed into a password field.
const MARKER = 'MKR7f3a';

/** Everything the app writes to the console during a test, as one string. */
function captureLogs() {
  const lines: string[] = [];
  for (const method of ['log', 'info', 'warn', 'error'] as const) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      lines.push(args.map((a) => (typeof a === 'string' ? a : inspect(a, { depth: 5 }))).join(' '));
    });
  }
  return () => lines.join('\n');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('error handler', () => {
  const app = createApp(fakeDeps());

  it.each([
    ['a truncated body', `{"email":"a@b.c","password":"${MARKER}"`],
    ['an invalid value the parser quotes back', `{"password": ${MARKER}}`],
  ])('answers malformed JSON (%s) with 400 VALIDATION and never logs what the client sent', async (_case, body) => {
    const logs = captureLogs();
    const res = await request(app).post('/anything').set('Content-Type', 'application/json').send(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: 'VALIDATION', message: 'Request body is not valid JSON' } });
    expect(res.text).not.toContain(MARKER);
    expect(logs()).not.toContain(MARKER);
    expect(logs()).toContain('400');
    expect(logs()).toContain('entity.parse.failed');
  });

  it('keeps the status of a client error, here a body over the size limit', async () => {
    const logs = captureLogs();
    const body = JSON.stringify({ password: MARKER, padding: 'x'.repeat(200_000) });
    const res = await request(app).post('/anything').set('Content-Type', 'application/json').send(body);

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
    expect(res.text).not.toContain(MARKER);
    expect(logs()).not.toContain(MARKER);
    expect(logs()).toContain('entity.too.large');
  });

  it('keeps the status of an unsupported body encoding', async () => {
    const logs = captureLogs();
    const res = await request(app)
      .post('/anything')
      .set('Content-Type', 'application/json')
      .set('Content-Encoding', 'not-a-real-encoding')
      .send('{}');

    expect(res.status).toBe(415);
    expect(res.body).toEqual({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Unsupported request body encoding' } });
    expect(logs()).toContain('encoding.unsupported');
  });

  it('answers an unexpected error with 500 INTERNAL and logs its stack', async () => {
    const logs = captureLogs();
    const boom = express();
    boom.get('/boom', () => {
      throw new Error('internal failure for the test');
    });
    boom.use(errorHandler);

    const res = await request(boom).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL', message: 'Internal server error' } });
    expect(logs()).toContain('internal failure for the test');
    expect(logs()).toMatch(/\n\s+at /);
  });
});
