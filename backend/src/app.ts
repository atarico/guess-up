import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler, notFound } from './middleware/errors.js';
import { requestLog } from './middleware/requestLog.js';
import type { UsersRepository } from './repositories/users.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';

/** Everything the app needs from outside. Tests pass fakes; index.ts passes the real ones. */
export type AppDeps = {
  corsOrigins: string[];
  jwtSecret: string;
  db: { ping(): Promise<void> };
  symbols: { countReady(): Promise<number> };
  apiUsage: { usedToday(): Promise<number> };
  users: UsersRepository;
};

export function createApp(deps: AppDeps) {
  const app = express();
  app.use(requestLog);
  app.use(helmet());
  // Only listed origins get CORS headers back; the browser blocks every other origin.
  app.use(cors({ origin: deps.corsOrigins }));
  app.use(express.json());
  app.use(healthRouter(deps));
  app.use(authRouter(deps));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
