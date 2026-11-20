import { Router } from 'express';
import { z } from 'zod';
import type { AppDeps } from '../app.js';
import { ApiError } from '../middleware/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validate.js';
import { roundService } from '../services/roundService.js';

const decisionBody = z.object({ decision: z.enum(['buy', 'pass']) });

export function roundsRouter(deps: Pick<AppDeps, 'jwtSecret' | 'rounds' | 'closes' | 'symbols' | 'random'>) {
  const router = Router();
  const rounds = roundService(deps);
  const auth = requireAuth(deps.jwtSecret);

  router.post('/rounds', auth, async (req, res) => {
    const round = await rounds.createOrResume(req.userId as string);
    // Built field by field from an allow-list (02 §7): id, points, resumed and nothing else.
    res.json({ round: { id: round.id, points: round.points }, resumed: round.resumed });
  });

  // The body is checked before anything is read: an invalid one gets 400 and no reveal (anonymity V8).
  router.post('/rounds/:id/decision', auth, validateBody(decisionBody), async (req, res) => {
    const { decision } = req.body as z.infer<typeof decisionBody>;
    // Postgres would throw on a malformed uuid; answer the same 404 as an unknown round (V9).
    const { id } = req.params;
    if (typeof id !== 'string' || !z.uuid().safeParse(id).success) throw new ApiError(404, 'NOT_FOUND', 'Round not found');
    const { reveal, streak } = await rounds.decide(req.userId as string, id, decision);
    res.json({ reveal, streak });
  });

  return router;
}
