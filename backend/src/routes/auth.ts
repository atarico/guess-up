import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import type { AppDeps } from '../app.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validate.js';
import { authService } from '../services/authService.js';

// bcrypt reads at most 72 bytes; past that, the rest of a password would not count. Characters
// like ñ take two bytes in UTF-8, so the maximum is counted in bytes (02 §4, DECISIONS.md).
const MAX_PASSWORD_BYTES = 72;

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .min(8)
    .refine((password) => Buffer.byteLength(password, 'utf8') <= MAX_PASSWORD_BYTES, {
      error: `Too long: expected at most ${MAX_PASSWORD_BYTES} bytes in UTF-8`,
    }),
});

type Credentials = z.infer<typeof credentials>;

export function authRouter(deps: Pick<AppDeps, 'users' | 'jwtSecret'>) {
  const router = Router();
  const auth = authService(deps.users, deps.jwtSecret);

  // Register and login only: /auth/me runs on every page load and would use up a normal
  // visitor's quota (02 §4). One limiter, so both routes draw from the same 20 per visitor.
  // The visitor is req.ip, which depends on TRUST_PROXY_HOPS (app.ts). The counters live in
  // memory and reset when the free instance sleeps.
  const limitAttempts = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } },
  });

  router.post('/auth/register', limitAttempts, validateBody(credentials), async (req, res) => {
    const { email, password } = req.body as Credentials;
    res.status(201).json(await auth.register(email, password));
  });

  router.post('/auth/login', limitAttempts, validateBody(credentials), async (req, res) => {
    const { email, password } = req.body as Credentials;
    res.json(await auth.login(email, password));
  });

  router.get('/auth/me', requireAuth(deps.jwtSecret), async (req, res) => {
    // requireAuth only calls the next handler after setting userId.
    res.json({ user: await auth.me(req.userId as string) });
  });

  return router;
}
