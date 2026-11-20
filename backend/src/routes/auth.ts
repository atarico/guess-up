import { Router } from 'express';
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

  router.post('/auth/register', validateBody(credentials), async (req, res) => {
    const { email, password } = req.body as Credentials;
    res.status(201).json(await auth.register(email, password));
  });

  router.post('/auth/login', validateBody(credentials), async (req, res) => {
    const { email, password } = req.body as Credentials;
    res.json(await auth.login(email, password));
  });

  router.get('/auth/me', requireAuth(deps.jwtSecret), async (req, res) => {
    // requireAuth only calls the next handler after setting userId.
    res.json({ user: await auth.me(req.userId as string) });
  });

  return router;
}
