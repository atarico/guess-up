import type { UniverseEntry } from '../data/universe.js';
import { isWeekend, prepareSeries } from '../domain/series.js';
import {
  type DailyClose,
  type DailySeries,
  type MarketDataProvider,
  UpstreamAuthError,
  UpstreamLimitError,
} from './provider.js';

/** What the seed needs from the database. Production passes the repositories; tests, an in-memory version. */
export type SeedStore = {
  upsertUniverse(entries: UniverseEntry[]): Promise<void>;
  statusOf(symbols: string[]): Promise<Map<string, string>>;
  replaceSeries(symbol: string, exchange: string | null, bars: DailyClose[]): Promise<void>;
  markFailed(symbol: string): Promise<void>;
  creditsUsedToday(): Promise<number>;
};

export type SeedDeps = {
  universe: UniverseEntry[];
  provider: MarketDataProvider;
  budget: { acquire(): Promise<void> };
  store: SeedStore;
  /** Waits until the provider's minute quota resets (it resets on the clock minute, 02 §5.1). */
  waitForNextMinute: () => Promise<void>;
  log: (line: string) => void;
  /** Fetch only this symbol (`--only`), for a one-credit end-to-end check. */
  only?: string;
};

export type SeedResult = { ready: string[]; failed: string[]; alreadyReady: number };

/**
 * Fetches one series, paying a credit first. A limit error is retried once, after the minute
 * window clears (02 §5.4). A rejected key stops everything, because every later call would fail
 * the same way. Any other provider failure returns null and the symbol is marked failed.
 */
async function fetchSeries(symbol: string, deps: SeedDeps): Promise<DailySeries | null> {
  for (let attempt = 1; ; attempt++) {
    await deps.budget.acquire(); // throws at the daily cap, which stops the seed
    try {
      return await deps.provider.fetchDailyCloses(symbol);
    } catch (err) {
      if (err instanceof UpstreamAuthError) throw err;
      if (err instanceof UpstreamLimitError && attempt === 1) {
        deps.log(`${symbol}: provider limit reached; retrying once after the minute window clears`);
        await deps.waitForNextMinute();
        continue;
      }
      deps.log(`${symbol} failed: ${(err as Error).message}`);
      return null;
    }
  }
}

/**
 * The seed of 02 §5.5. Idempotent and resumable: every universe entry is upserted (a `ready`
 * symbol stays `ready`), and only symbols that are not `ready` are fetched, so a second run
 * fetches nothing and a run after a failure fetches only what failed.
 */
export async function runSeed(deps: SeedDeps): Promise<SeedResult> {
  const { universe, only } = deps;
  if (only !== undefined && !universe.some((entry) => entry.symbol === only)) {
    throw new Error(`${only} is not in the universe (src/data/universe.ts)`);
  }

  await deps.store.upsertUniverse(universe);
  const status = await deps.store.statusOf(universe.map((entry) => entry.symbol));
  const candidates = universe.filter((entry) => only === undefined || entry.symbol === only);
  const targets = candidates.filter((entry) => status.get(entry.symbol) !== 'ready');
  const result: SeedResult = { ready: [], failed: [], alreadyReady: candidates.length - targets.length };

  for (const { symbol } of targets) {
    const series = await fetchSeries(symbol, deps);
    if (series === null) {
      await deps.store.markFailed(symbol);
      result.failed.push(symbol);
      continue;
    }

    const check = prepareSeries(series.bars);
    if (!check.ok) {
      deps.log(`${symbol} failed: ${check.reason}`);
      await deps.store.markFailed(symbol);
      result.failed.push(symbol);
      continue;
    }

    await deps.store.replaceSeries(symbol, series.exchange, check.bars);
    const used = await deps.store.creditsUsedToday();
    const first = check.bars[0].d;
    const last = check.bars[check.bars.length - 1].d;
    // prepareSeries discarded these; naming them lets the author see a provider error was caught.
    const weekend = series.bars.filter((bar) => isWeekend(bar.d)).map((bar) => bar.d);
    const dropped = weekend.length > 0 ? `, weekend bars dropped: ${weekend.join(', ')}` : '';
    deps.log(`${symbol} ready: ${check.bars.length} bars, ${first} → ${last}, credits used today: ${used}${dropped}`);
    result.ready.push(symbol);
  }

  return result;
}
