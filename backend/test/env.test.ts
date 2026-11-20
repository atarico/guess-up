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

  it('names missing or invalid variables without printing their values', () => {
    const source = { ...valid, DATABASE_URL: undefined, JWT_SECRET: 'too-short-secret' };
    expect(() => loadEnv(source)).toThrow(/DATABASE_URL, JWT_SECRET/);
    expect(() => loadEnv(source)).not.toThrow(/too-short-secret/);
  });
});
