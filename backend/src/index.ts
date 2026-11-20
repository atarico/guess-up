import { createApp } from './app.js';
import { createPool } from './db.js';
import { loadEnv } from './env.js';
import { createCreditBudget } from './marketdata/creditBudget.js';
import { createTwelveDataProvider } from './marketdata/twelveData.js';
import { apiUsageRepository } from './repositories/apiUsage.js';
import { closesRepository } from './repositories/closes.js';
import { roundsRepository } from './repositories/rounds.js';
import { symbolsRepository } from './repositories/symbols.js';
import { usersRepository } from './repositories/users.js';
import { createLiveQuoteService } from './services/liveQuoteService.js';

const env = loadEnv();
const pool = createPool(env.DATABASE_URL);

const apiUsage = apiUsageRepository(pool);

const app = createApp({
  corsOrigins: env.corsOrigins,
  jwtSecret: env.JWT_SECRET,
  trustProxyHops: env.TRUST_PROXY_HOPS,
  db: {
    async ping() {
      await pool.query('select 1');
    },
  },
  symbols: symbolsRepository(pool),
  apiUsage,
  users: usersRepository(pool),
  closes: closesRepository(pool),
  rounds: roundsRepository(pool),
  // The server's one door to Twelve Data and its one credit budget (02 §5.3, §5.4).
  liveQuote: createLiveQuoteService({
    provider: createTwelveDataProvider({ apiKey: env.TWELVE_DATA_API_KEY }),
    budget: createCreditBudget({ clock: Date.now, daily: apiUsage }),
    clock: Date.now,
  }),
  random: Math.random,
});

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});
