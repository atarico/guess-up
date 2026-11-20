import { createPool } from '../db.js';
import { closesRepository } from '../repositories/closes.js';
import { roundsRepository } from '../repositories/rounds.js';
import { symbolsRepository } from '../repositories/symbols.js';
import { usersRepository } from '../repositories/users.js';
import { demoConfig, runDemoSeed, type DemoConfig } from '../services/demoSeed.js';
import { statsService } from '../services/statsService.js';

// pnpm seed:demo           creates the demo user if missing and tops it up to 40 decided rounds (02 §5.5)
// pnpm seed:demo --reset   deletes the demo user's rounds first, for new charts

let config: DemoConfig;
try {
  config = demoConfig(process.env, process.argv.slice(2));
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing environment variables: DATABASE_URL. Add them to backend/.env.');
  process.exit(1);
}

const pool = createPool(databaseUrl);
const rounds = roundsRepository(pool);
const signed = (x: number) => `${x > 0 ? '+' : ''}${(x * 100).toFixed(1)}`;

try {
  const result = await runDemoSeed(
    { users: usersRepository(pool), rounds, symbols: symbolsRepository(pool), closes: closesRepository(pool), random: Math.random },
    config,
  );
  const removed = config.reset ? ` Removed ${result.removed} rounds (--reset).` : '';
  console.log(
    `Demo user ${config.email}: ${result.created ? 'created' : 'already there'}.${removed} ` +
      `Added ${result.added} decided rounds; ${result.decided} in all.`,
  );

  // The same figures GET /stats returns, so the verdict the account shows is known without logging in.
  const stats = await statsService({ rounds }).forUser(result.userId);
  if (stats.coin && stats.edge !== null) {
    console.log(
      `Verdict on Stats: ${stats.verdict} (${stats.rounds} rounds, ${stats.buys} bought; ` +
        `edge ${signed(stats.edge)} points, coin range ${signed(stats.coin.p5)} to ${signed(stats.coin.p95)}).`,
    );
  } else {
    console.log(`Verdict on Stats: ${stats.verdict}.`);
  }
  if (stats.verdict !== 'coin') {
    console.log('The coin landed outside its own range. Run pnpm seed:demo --reset for new charts.');
  }
} catch (err) {
  console.error(`Demo seed stopped: ${(err as Error).message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
