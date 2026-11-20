import type { ErrorRequestHandler, RequestHandler } from 'express';

/** Unknown routes answer with the same error shape as every other error (02 §7). */
export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
};

/** Last middleware: log the stack, answer with a generic message (02 §8). */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
};
