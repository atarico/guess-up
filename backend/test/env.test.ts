import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env.js';

const valid = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
  TWELVE_DATA_API_KEY: 'key',
  CORS_ORIGIN: 'http://localhost:3000, https://guess-up.vercel.app',
  PORT: '4000',
};

describe('loadEnv', () => {
  it('splits CORS_ORIGIN into trimmed origins and reads PORT as a number', () => {
    const env = loadEnv(valid);
    expect(env.corsOrigins).toEqual(['http://localhost:3000', 'https://guess-up.vercel.app']);
    expect(env.PORT).toBe(4000);
  });

  it.each([
    ['a trailing slash', 'http://localhost:3000, https://guess-up.vercel.app/', 'entry "https://guess-up.vercel.app/" is not an origin'],
    ['a path', 'https://guess-up.vercel.app/play', 'entry "https://guess-up.vercel.app/play" is not an origin'],
    ['a wildcard', '*', 'entry "*" is not an origin'],
    ['an empty entry', 'http://localhost:3000,,https://guess-up.vercel.app', 'CORS_ORIGIN has an empty entry'],
    ['an empty list', ' ', 'CORS_ORIGIN must list at least one origin'],
    ['an empty variable', '', 'Missing or invalid environment variables: CORS_ORIGIN'],
  ])('refuses CORS_ORIGIN with %s and says which entry is wrong', (_case, corsOrigin, message) => {
    expect(() => loadEnv({ ...valid, CORS_ORIGIN: corsOrigin })).toThrow(message);
  });

  it('reads TRUST_PROXY_HOPS as a whole number, 0 when it is not set', () => {
    expect(loadEnv(valid).TRUST_PROXY_HOPS).toBe(0);
    expect(loadEnv({ ...valid, TRUST_PROXY_HOPS: '3' }).TRUST_PROXY_HOPS).toBe(3);
  });

  it.each(['-1', '1.5', 'true'])('refuses TRUST_PROXY_HOPS=%s', (hops) => {
    expect(() => loadEnv({ ...valid, TRUST_PROXY_HOPS: hops })).toThrow(/TRUST_PROXY_HOPS/);
  });

  it('names missing or invalid variables without printing their values', () => {
    const source = { ...valid, DATABASE_URL: undefined, JWT_SECRET: 'too-short-secret' };
    expect(() => loadEnv(source)).toThrow(/DATABASE_URL, JWT_SECRET/);
    expect(() => loadEnv(source)).not.toThrow(/too-short-secret/);
  });
});
