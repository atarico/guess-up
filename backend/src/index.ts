import { createApp } from './app.js';
import { createPool } from './db.js';
import { loadEnv } from './env.js';
import { apiUsageRepository } from './repositories/apiUsage.js';
import { symbolsRepository } from './repositories/symbols.js';

const env = loadEnv();
const pool = createPool(env.DATABASE_URL);

const app = createApp({
  corsOrigins: env.corsOrigins,
  db: {
    async ping() {
      await pool.query('select 1');
    },
  },
  symbols: symbolsRepository(pool),
  apiUsage: apiUsageRepository(pool),
});

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});
