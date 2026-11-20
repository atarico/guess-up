import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { ApiError } from './errors.js';

/**
 * Checks the JSON body against a route's schema (02 §8) and replaces it with the parsed value,
 * so the route reads the normalised data (a lower-cased email, for instance).
 * Failure → 400 VALIDATION with the first issue; zod's messages name the rule, not the value.
 */
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join('.') || 'body';
      next(new ApiError(400, 'VALIDATION', `${field}: ${issue.message}`));
      return;
    }
    req.body = parsed.data;
    next();
  };
}
