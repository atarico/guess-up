import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ALGORITHM } from '../services/authService.js';
import { ApiError } from './errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- the way to add a field to Express's Request type
  namespace Express {
    interface Request {
      /** The `sub` of a verified token; set by requireAuth. */
      userId?: string;
    }
  }
}

const BEARER = 'Bearer ';

/** Verifies `Authorization: Bearer <token>`: signature, algorithm and expiry (02 §4). */
export function requireAuth(jwtSecret: string): RequestHandler {
  return (req, _res, next) => {
    const header = req.get('authorization');
    if (!header?.startsWith(BEARER)) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Missing bearer token'));
      return;
    }
    try {
      // Pinned: left open, jsonwebtoken also accepts HS384 and HS512 tokens made with the same secret.
      const payload = jwt.verify(header.slice(BEARER.length), jwtSecret, { algorithms: [JWT_ALGORITHM] });
      if (typeof payload === 'string' || typeof payload.sub !== 'string') throw new Error('token has no subject');
      req.userId = payload.sub;
      next();
    } catch {
      next(new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
    }
  };
}
