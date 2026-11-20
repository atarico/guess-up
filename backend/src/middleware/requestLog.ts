import type { RequestHandler } from 'express';

/**
 * One line per request (02 §8): method, path without its query string, status and milliseconds.
 * Nothing else: no headers, no query string, no body, so tokens and passwords never reach the logs.
 */
export const requestLog: RequestHandler = (req, res, next) => {
  const started = performance.now();
  res.on('finish', () => {
    const path = req.originalUrl.split('?')[0];
    const ms = Math.round(performance.now() - started);
    console.log(`${req.method} ${path} ${res.statusCode} ${ms}ms`);
  });
  next();
};
