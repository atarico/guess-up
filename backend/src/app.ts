import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler, notFound } from './middleware/errors.js';
import { requestLog } from './middleware/requestLog.js';
import type { ClosesReads } from './repositories/closes.js';
import type { RoundsRepository } from './repositories/rounds.js';
import type { SymbolReads } from './repositories/symbols.js';
import type { UsersRepository } from './repositories/users.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { roundsRouter } from './routes/rounds.js';
import { statsRouter } from './routes/stats.js';

/** Everything the app needs from outside. Tests pass fakes; index.ts passes the real ones. */
export type AppDeps = {
  corsOrigins: string[];
  jwtSecret: string;
  trustProxyHops: number;
  db: { ping(): Promise<void> };
  symbols: SymbolReads;
  apiUsage: { usedToday(): Promise<number> };
  users: UsersRepository;
  closes: ClosesReads;
  rounds: RoundsRepository;
  /** A number in [0, 1) for picking rounds: Math.random in production (02 §6). */
  random: () => number;
};

export function createApp(deps: AppDeps) {
  const app = express();
  // On Render the socket belongs to a proxy. Trusting exactly the measured number of hops makes
  // req.ip the visitor, so the /auth limit counts per visitor (02 §4). Never `true`: the client
  // could then choose its own address. At 0 nothing is set, and express-rate-limit warns if a
  // forwarded header ever shows up.
  if (deps.trustProxyHops > 0) app.set('trust proxy', deps.trustProxyHops);
  app.use(requestLog);
  app.use(helmet());
  // Only listed origins get CORS headers back; the browser blocks every other origin.
  app.use(cors({ origin: deps.corsOrigins }));
  app.use(express.json());
  app.use(healthRouter(deps));
  app.use(authRouter(deps));
  app.use(roundsRouter(deps));
  app.use(statsRouter(deps));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
