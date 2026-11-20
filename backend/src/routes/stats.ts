import { Router } from 'express';
import type { AppDeps } from '../app.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { statsService } from '../services/statsService.js';

export function statsRouter(deps: Pick<AppDeps, 'jwtSecret' | 'rounds'>) {
  const router = Router();
  const stats = statsService(deps);

  router.get('/stats', requireAuth(deps.jwtSecret), async (req, res) => {
    // Computed figures, not a stored row: every field is part of the 02 §7 contract.
    res.json(await stats.forUser(req.userId as string));
  });

  return router;
}
