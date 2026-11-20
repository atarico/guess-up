import { randomUUID } from 'node:crypto';
import type { AppDeps } from '../src/app.js';
import type { UserWithHash, UsersRepository } from '../src/repositories/users.js';

export const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-chars';

/** In-memory users table: the email is unique, like the real index. */
export function inMemoryUsers(): UsersRepository & { rows: Map<string, UserWithHash> } {
  const rows = new Map<string, UserWithHash>();
  const publicFields = ({ id, email, isDemo }: UserWithHash) => ({ id, email, isDemo });
  return {
    rows,
    async create(email, passwordHash) {
      if ([...rows.values()].some((row) => row.email === email)) return null;
      const row = { id: randomUUID(), email, isDemo: false, passwordHash };
      rows.set(row.id, row);
      return publicFields(row);
    },
    async findByEmail(email) {
      return [...rows.values()].find((row) => row.email === email) ?? null;
    },
    async findById(id) {
      const row = rows.get(id);
      return row ? publicFields(row) : null;
    },
  };
}

/** In-memory dependencies for route tests: no network, no database. */
export function fakeDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    corsOrigins: ['http://localhost:3000'],
    jwtSecret: TEST_JWT_SECRET,
    trustProxyHops: 0,
    db: { ping: async () => {} },
    symbols: { countReady: async () => 3 },
    apiUsage: { usedToday: async () => 5 },
    users: inMemoryUsers(),
    ...overrides,
  };
}
