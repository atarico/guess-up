import { randomUUID } from 'node:crypto';
import type { AppDeps } from '../src/app.js';
import type { DailyClose } from '../src/marketdata/provider.js';
import type { ClosesReads } from '../src/repositories/closes.js';
import type { NewRound, RoundsRepository, StoredRound } from '../src/repositories/rounds.js';
import type { SymbolInfo, SymbolReads } from '../src/repositories/symbols.js';
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

/** `n` trading days (weekdays) from 2011-01-03, with a close drawn by `price(i)`. */
export function tradingDays(n: number, price: (i: number) => number): DailyClose[] {
  const bars: DailyClose[] = [];
  for (let t = Date.UTC(2011, 0, 3); bars.length < n; t += 86_400_000) {
    const day = new Date(t).getUTCDay();
    if (day !== 0 && day !== 6) bars.push({ d: new Date(t).toISOString().slice(0, 10), close: price(bars.length) });
  }
  return bars;
}

/**
 * Three ready stocks with names nothing else in a response could contain, so a test can search a
 * body, a header or a log line for them.
 */
export const FAKE_STOCKS: SymbolInfo[] = [
  { symbol: 'ZZQX', name: 'Quuxcorp Industries', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'YYWV', name: 'Wavelet Holdings', sector: 'Energy', exchange: 'NYSE' },
  { symbol: 'XXRT', name: 'Rotor Dynamics', sector: 'Industrials', exchange: 'NYSE' },
];

/** In-memory symbols and closes: 400 bars per stock, a different wave for each. */
export function inMemoryMarket(stocks: SymbolInfo[] = FAKE_STOCKS) {
  const closes = new Map<string, DailyClose[]>(
    stocks.map((stock, k) => [stock.symbol, tradingDays(400, (i) => 50 + 10 * k + 8 * Math.sin(i / (6 + k)) + i * 0.05)]),
  );
  const calls = { series: 0, upTo: 0 };
  const symbols: SymbolReads = {
    async countReady() {
      return stocks.length;
    },
    async listReady() {
      return stocks.map((stock) => stock.symbol);
    },
    async find(symbol) {
      return stocks.find((stock) => stock.symbol === symbol) ?? null;
    },
  };
  const reads: ClosesReads = {
    async series(symbol) {
      calls.series++;
      return [...(closes.get(symbol) ?? [])];
    },
    async upTo(symbol, cutoffDate, count) {
      calls.upTo++;
      return (closes.get(symbol) ?? []).filter((bar) => bar.d <= cutoffDate).slice(-count);
    },
    async after(symbol, cutoffDate, count) {
      return (closes.get(symbol) ?? []).filter((bar) => bar.d > cutoffDate).slice(0, count);
    },
  };
  return { symbols, closes: reads, data: closes, calls };
}

type Row = StoredRound & { userId: string; decidedAt: number | null };

/**
 * In-memory rounds table. Like the partial unique index, it refuses a second open round per user;
 * like `numeric(9,6)`, it keeps the forward return to six decimals.
 */
export function inMemoryRounds(): RoundsRepository & { rows: Map<string, Row> } {
  const rows = new Map<string, Row>();
  let clock = 0;
  const stored = ({ id, symbol, cutoffDate, forwardReturn, decision }: Row): StoredRound => ({ id, symbol, cutoffDate, forwardReturn, decision });
  return {
    rows,
    async findOpen(userId) {
      const row = [...rows.values()].find((r) => r.userId === userId && r.decision === null);
      return row ? { id: row.id, symbol: row.symbol, cutoffDate: row.cutoffDate } : null;
    },
    async insertOpen({ userId, symbol, cutoffDate, forwardReturn }: NewRound) {
      if ([...rows.values()].some((r) => r.userId === userId && r.decision === null)) return null;
      const id = randomUUID();
      rows.set(id, { id, userId, symbol, cutoffDate, forwardReturn: Number(forwardReturn.toFixed(6)), decision: null, decidedAt: null });
      return id;
    },
    async decide(id, userId, decision) {
      const row = rows.get(id);
      if (!row || row.userId !== userId || row.decision !== null) return null;
      row.decision = decision;
      row.decidedAt = ++clock;
      return stored(row);
    },
    async findOwn(id, userId) {
      const row = rows.get(id);
      return row && row.userId === userId ? stored(row) : null;
    },
    async decidedInOrder(userId) {
      return [...rows.values()]
        .filter((r) => r.userId === userId && r.decision !== null)
        .sort((a, b) => (a.decidedAt ?? 0) - (b.decidedAt ?? 0))
        .map((r) => ({ decision: r.decision as 'buy' | 'pass', r: r.forwardReturn }));
    },
  };
}

/** In-memory dependencies for route tests: no network, no database. */
export function fakeDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  const market = inMemoryMarket();
  return {
    corsOrigins: ['http://localhost:3000'],
    jwtSecret: TEST_JWT_SECRET,
    trustProxyHops: 0,
    db: { ping: async () => {} },
    symbols: market.symbols,
    apiUsage: { usedToday: async () => 5 },
    users: inMemoryUsers(),
    closes: market.closes,
    rounds: inMemoryRounds(),
    random: () => 0.5,
    ...overrides,
  };
}
