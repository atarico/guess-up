import { describe, expect, it } from 'vitest';
import type { UniverseEntry } from '../src/data/universe.js';
import { DailyBudgetExhaustedError } from '../src/marketdata/creditBudget.js';
import { createFakeProvider } from '../src/marketdata/fakeProvider.js';
import {
  type DailyClose,
  type DailySeries,
  UpstreamAuthError,
  UpstreamLimitError,
  UpstreamNotFoundError,
} from '../src/marketdata/provider.js';
import { type SeedDeps, type SeedStore, runSeed } from '../src/marketdata/seed.js';
import { tradingDays } from './fakeDeps.js';

const universe: UniverseEntry[] = [
  { symbol: 'AAA', name: 'Alpha Inc.', sector: 'Technology' },
  { symbol: 'BBB', name: 'Beta Corp.', sector: 'Energy' },
  { symbol: 'CCC', name: 'Gamma Co.', sector: 'Utilities' },
];

/** `n` trading days (weekdays) with positive closes, oldest first, like a real series. */
function series(n: number, exchange = 'NYSE'): DailySeries {
  return { exchange, bars: tradingDays(n, (i) => 20 + i / 100) };
}

/** The tables the seed touches, in memory. */
function memoryStore() {
  const symbols = new Map<string, { name: string; sector: string; status: string; exchange: string | null }>();
  const closes = new Map<string, DailyClose[]>();
  let credits = 0;
  const store: SeedStore = {
    async upsertUniverse(entries) {
      for (const entry of entries) {
        const existing = symbols.get(entry.symbol);
        symbols.set(entry.symbol, {
          name: entry.name,
          sector: entry.sector,
          status: existing?.status ?? 'pending',
          exchange: existing?.exchange ?? null,
        });
      }
    },
    async statusOf(list) {
      return new Map(list.map((symbol) => [symbol, symbols.get(symbol)?.status ?? 'missing']));
    },
    async replaceSeries(symbol, exchange, bars) {
      closes.set(symbol, bars);
      symbols.set(symbol, { ...symbols.get(symbol)!, status: 'ready', exchange });
    },
    async markFailed(symbol) {
      symbols.set(symbol, { ...symbols.get(symbol)!, status: 'failed' });
    },
    async creditsUsedToday() {
      return credits;
    },
  };
  return { store, symbols, closes, spendCredit: () => credits++ };
}

function seedDeps(
  answers: Parameters<typeof createFakeProvider>[0],
  memory = memoryStore(),
  extra: Partial<SeedDeps> = {},
) {
  const { provider, calls } = createFakeProvider(answers);
  const lines: string[] = [];
  let acquired = 0;
  let minuteWaits = 0;
  const deps: SeedDeps = {
    universe,
    provider,
    budget: {
      acquire: async () => {
        acquired++;
        memory.spendCredit();
      },
    },
    store: memory.store,
    waitForNextMinute: async () => {
      minuteWaits++;
    },
    log: (line) => lines.push(line),
    ...extra,
  };
  return { deps, calls, lines, memory, counts: () => ({ acquired, minuteWaits }) };
}

describe('runSeed (02 §5.5)', () => {
  it('upserts the universe, then fetches and stores every symbol, one credit and one log line each', async () => {
    const run = seedDeps({ AAA: series(450), BBB: series(500, 'NASDAQ'), CCC: series(420) });
    const result = await runSeed(run.deps);

    expect(result).toEqual({ ready: ['AAA', 'BBB', 'CCC'], failed: [], alreadyReady: 0 });
    expect(run.calls).toEqual(['AAA', 'BBB', 'CCC']);
    expect(run.counts().acquired).toBe(3);
    expect(run.memory.closes.get('AAA')).toHaveLength(449); // the latest bar is dropped
    expect(run.memory.symbols.get('BBB')).toMatchObject({ name: 'Beta Corp.', status: 'ready', exchange: 'NASDAQ' });
    expect(run.lines[0]).toBe('AAA ready: 449 bars, 2011-01-03 → 2012-09-20, credits used today: 1');
    expect(run.lines).toHaveLength(3);
  });

  it('stores a series without its weekend bars, and names them in the log line', async () => {
    const weekdays = series(450);
    const withSunday = { exchange: 'NYSE', bars: [...weekdays.bars.slice(0, 5), { d: '2011-01-09', close: 49 }, ...weekdays.bars.slice(5)] };
    const run = seedDeps({ AAA: withSunday }, memoryStore(), { only: 'AAA' });
    await runSeed(run.deps);

    expect(run.memory.closes.get('AAA')).toEqual(weekdays.bars.slice(0, -1));
    expect(run.lines[0]).toBe('AAA ready: 449 bars, 2011-01-03 → 2012-09-20, credits used today: 1, weekend bars dropped: 2011-01-09');
  });

  it('is idempotent: a second run fetches nothing', async () => {
    const memory = memoryStore();
    await runSeed(seedDeps({ AAA: series(450), BBB: series(450), CCC: series(450) }, memory).deps);

    const second = seedDeps({}, memory);
    expect(await runSeed(second.deps)).toEqual({ ready: [], failed: [], alreadyReady: 3 });
    expect(second.calls).toEqual([]);
  });

  it('is resumable: a symbol the provider could not serve is marked failed and is the only one fetched next time', async () => {
    const memory = memoryStore();
    const first = await runSeed(
      seedDeps({ AAA: series(450), BBB: new UpstreamNotFoundError('unknown symbol BBB'), CCC: series(450) }, memory).deps,
    );
    expect(first).toEqual({ ready: ['AAA', 'CCC'], failed: ['BBB'], alreadyReady: 0 });
    expect(memory.symbols.get('BBB')?.status).toBe('failed');

    const second = seedDeps({ BBB: series(450) }, memory);
    expect(await runSeed(second.deps)).toEqual({ ready: ['BBB'], failed: [], alreadyReady: 2 });
    expect(second.calls).toEqual(['BBB']);
  });

  it('marks a rejected series failed without storing it, and says why', async () => {
    const run = seedDeps({ AAA: series(400), BBB: series(450), CCC: series(450) });
    const result = await runSeed(run.deps);

    expect(result.failed).toEqual(['AAA']);
    expect(run.memory.closes.has('AAA')).toBe(false);
    expect(run.lines).toContain('AAA failed: only 399 bars after dropping the latest one (minimum 400)');
  });

  it('retries a limited symbol once, after the minute window clears', async () => {
    const run = seedDeps({ AAA: [new UpstreamLimitError('limit'), series(450)], BBB: series(450), CCC: series(450) });
    const result = await runSeed(run.deps);

    expect(result.ready).toEqual(['AAA', 'BBB', 'CCC']);
    expect(run.counts()).toEqual({ acquired: 4, minuteWaits: 1 });
  });

  it('marks a symbol failed when it is limited twice', async () => {
    const run = seedDeps({
      AAA: [new UpstreamLimitError('limit'), new UpstreamLimitError('limit again')],
      BBB: series(450),
      CCC: series(450),
    });
    expect((await runSeed(run.deps)).failed).toEqual(['AAA']);
  });

  it('stops everything on a rejected API key', async () => {
    const run = seedDeps({ AAA: new UpstreamAuthError('key rejected'), BBB: series(450), CCC: series(450) });
    await expect(runSeed(run.deps)).rejects.toBeInstanceOf(UpstreamAuthError);
    expect(run.calls).toEqual(['AAA']);
  });

  it('stops when the daily credit cap is reached', async () => {
    const run = seedDeps({ AAA: series(450) }, memoryStore(), {
      budget: {
        acquire: async () => {
          throw new DailyBudgetExhaustedError('daily cap reached');
        },
      },
    });
    await expect(runSeed(run.deps)).rejects.toBeInstanceOf(DailyBudgetExhaustedError);
    expect(run.calls).toEqual([]);
  });

  it('with --only, fetches just that symbol, and refuses one outside the universe', async () => {
    const run = seedDeps({ BBB: series(450) }, memoryStore(), { only: 'BBB' });
    expect(await runSeed(run.deps)).toEqual({ ready: ['BBB'], failed: [], alreadyReady: 0 });
    expect(run.calls).toEqual(['BBB']);
    expect(run.memory.symbols.size).toBe(3); // the whole universe is still upserted

    const outside = seedDeps({}, memoryStore(), { only: 'ZZZ' });
    await expect(runSeed(outside.deps)).rejects.toThrow('ZZZ is not in the universe');
  });
});
