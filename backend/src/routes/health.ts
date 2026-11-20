import { Router } from 'express';
import type { AppDeps } from '../app.js';

// Not `/health`: EasyPrivacy, which Brave Shields and uBlock Origin apply by default, blocks
// cross-site requests to onrender.com/health (DECISIONS.md). The frontend has its own copy in lib/api.ts.
export const HEALTH_PATH = '/status';

// Work unit 2 moves this cap into marketdata/creditBudget.ts (02 §5.3).
const DAILY_CREDIT_CAP = 750;

export function healthRouter(deps: Pick<AppDeps, 'db' | 'symbols' | 'apiUsage'>) {
  const router = Router();

  // Always 200 while the process is up: Render keeps the deploy live, and the frontend
  // can tell "server awake, database down" (`db: false`) from "server asleep" (02 §7).
  router.get(HEALTH_PATH, async (_req, res) => {
    try {
      await deps.db.ping();
      const [symbolsReady, usedToday] = await Promise.all([
        deps.symbols.countReady(),
        deps.apiUsage.usedToday(),
      ]);
      res.json({ ok: true, db: true, symbolsReady, credits: { usedToday, dailyCap: DAILY_CREDIT_CAP } });
    } catch (err) {
      console.error('Health check: database unavailable:', (err as Error).message);
      res.json({ ok: true, db: false });
    }
  });

  return router;
}
