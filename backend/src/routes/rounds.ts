import { Router } from 'express';
import type { AppDeps } from '../app.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { roundService } from '../services/roundService.js';

export function roundsRouter(deps: Pick<AppDeps, 'jwtSecret' | 'rounds' | 'closes' | 'symbols' | 'random'>) {
  const router = Router();
  const rounds = roundService(deps);
  const auth = requireAuth(deps.jwtSecret);

  router.post('/rounds', auth, async (req, res) => {
    const round = await rounds.createOrResume(req.userId as string);
    // Built field by field from an allow-list (02 §7): id, points, resumed and nothing else.
    res.json({ round: { id: round.id, points: round.points }, resumed: round.resumed });
  });

  return router;
}
