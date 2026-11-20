import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { fakeDeps } from './fakeDeps.js';

afterEach(() => {
  vi.restoreAllMocks();
});

function captureLogLines() {
  const lines: string[] = [];
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  return lines;
}

describe('request log', () => {
  it('logs one line with method, path without the query string, status and milliseconds', async () => {
    const lines = captureLogLines();
    await request(createApp(fakeDeps())).get('/status?token=QUERY-SECRET-1');

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^GET \/status 200 \d+ms$/);
    expect(lines[0]).not.toContain('QUERY-SECRET-1');
  });

  it('never logs headers or the body', async () => {
    const lines = captureLogLines();
    await request(createApp(fakeDeps()))
      .post('/anything')
      .set('Authorization', 'Bearer HEADER-SECRET-2')
      .send({ password: 'BODY-SECRET-3' });

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^POST \/anything 404 \d+ms$/);
    expect(lines.join('\n')).not.toMatch(/HEADER-SECRET-2|BODY-SECRET-3/);
  });
});
