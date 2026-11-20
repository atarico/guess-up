import { UNIVERSE } from '../data/universe.js';
import { createPool } from '../db.js';
import { createCreditBudget } from '../marketdata/creditBudget.js';
import { runSeed } from '../marketdata/seed.js';
import { createTwelveDataProvider } from '../marketdata/twelveData.js';
import { apiUsageRepository } from '../repositories/apiUsage.js';
import { closesRepository } from '../repositories/closes.js';
import { symbolsRepository } from '../repositories/symbols.js';

// pnpm seed            fetches every universe symbol that is not ready yet (02 §5.5)
// pnpm seed --only X   fetches only symbol X: one credit, for an end-to-end check
// Run it while the deployed server is idle: the minute window is per process (02 §5.3).

function parseArgs(args: string[]): { only?: string } {
  if (args.length === 0) return {};
  if (args.length === 2 && args[0] === '--only' && /^[A-Za-z.]+$/.test(args[1])) return { only: args[1].toUpperCase() };
  console.error('Usage: pnpm seed [--only SYMBOL]');
  process.exit(1);
}

const { only } = parseArgs(process.argv.slice(2));
const databaseUrl = process.env.DATABASE_URL;
const apiKey = process.env.TWELVE_DATA_API_KEY;
const missing = [!databaseUrl && 'DATABASE_URL', !apiKey && 'TWELVE_DATA_API_KEY'].filter(Boolean);
if (!databaseUrl || !apiKey) {
  console.error(`Missing environment variables: ${missing.join(', ')}. Add them to backend/.env.`);
  process.exit(1);
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const pool = createPool(databaseUrl);
const symbols = symbolsRepository(pool);
const closes = closesRepository(pool);
const apiUsage = apiUsageRepository(pool);

try {
  const result = await runSeed({
    universe: UNIVERSE,
    provider: createTwelveDataProvider({ apiKey }),
    budget: createCreditBudget({ clock: Date.now, daily: apiUsage }),
    store: {
      upsertUniverse: symbols.upsertUniverse,
      statusOf: symbols.statusOf,
      replaceSeries: closes.replaceSeries,
      markFailed: symbols.markFailed,
      creditsUsedToday: apiUsage.usedToday,
    },
    // The provider's minute quota resets on the clock minute (02 §5.1); one extra second of margin.
    waitForNextMinute: () => sleep(60_000 - (Date.now() % 60_000) + 1_000),
    log: (line) => console.log(line),
    only,
  });
  const failed = result.failed.length > 0 ? ` (${result.failed.join(', ')})` : '';
  console.log(
    `Done: ${result.ready.length} stored, ${result.failed.length} failed${failed}, ${result.alreadyReady} already ready. ` +
      `Credits used today: ${await apiUsage.usedToday()}.`,
  );
} catch (err) {
  console.error(`Seed stopped: ${(err as Error).message}. Run it again later; it resumes where it stopped.`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
