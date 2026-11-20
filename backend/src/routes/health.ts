import { Router } from 'express';
import type { AppDeps } from '../app.js';
import { DAILY_CREDIT_CAP } from '../marketdata/creditBudget.js';

// Not `/health`: EasyPrivacy, which Brave Shields and uBlock Origin apply by default, blocks
// cross-site requests to onrender.com/health (DECISIONS.md). The frontend has its own copy in lib/api.ts.
export const HEALTH_PATH = '/status';

// Render's health check needs an answer within 5 s; 2 s leaves room for the network.
// Only this route uses it; the pool's general timeouts are much longer (db.ts).
export const HEALTH_DB_TIMEOUT_MS = 2_000;

/** Rejects if `work` has not settled after `ms`. The work itself keeps running until the pool's own timeouts. */
function withDeadline<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`no answer within ${ms} ms`)), ms);
  });
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}

export function healthRouter(deps: Pick<AppDeps, 'db' | 'symbols' | 'apiUsage'>) {
  const router = Router();

  // Always 200 while the process is up: Render keeps the deploy live, and the frontend
  // can tell "server awake, database down" (`db: false`) from "server asleep" (02 §7).
  router.get(HEALTH_PATH, async (_req, res) => {
    try {
      const checks = async () => {
        await deps.db.ping();
        return Promise.all([deps.symbols.countReady(), deps.apiUsage.usedToday()]);
      };
      const [symbolsReady, usedToday] = await withDeadline(checks(), HEALTH_DB_TIMEOUT_MS);
      res.json({ ok: true, db: true, symbolsReady, credits: { usedToday, dailyCap: DAILY_CREDIT_CAP } });
    } catch (err) {
      console.error('Health check: database unavailable:', (err as Error).message);
      res.json({ ok: true, db: false });
    }
  });

  return router;
}
