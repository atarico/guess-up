import type { AppDeps } from '../src/app.js';

/** In-memory dependencies for route tests: no network, no database. */
export function fakeDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    corsOrigins: ['http://localhost:3000'],
    db: { ping: async () => {} },
    symbols: { countReady: async () => 3 },
    apiUsage: { usedToday: async () => 5 },
    ...overrides,
  };
}
