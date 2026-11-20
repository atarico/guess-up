import type { ErrorRequestHandler, RequestHandler } from 'express';

/** Unknown routes answer with the same error shape as every other error (02 §7). */
export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
};

// Error codes of 02 §7 by HTTP status, for the client errors that reach this handler.
const CLIENT_ERROR_CODES: Record<number, string> = {
  400: 'VALIDATION',
  401: 'UNAUTHORIZED',
  404: 'NOT_FOUND',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
};

/** Our own message for each client error. The parser's message can quote what the client sent. */
function clientMessage(status: number, type: string): string {
  if (type === 'entity.parse.failed') return 'Request body is not valid JSON';
  if (type === 'entity.too.large') return 'Request body is too large';
  if (status === 415) return 'Unsupported request body encoding';
  return 'Invalid request';
}

function statusOf(err: unknown): number {
  const status = (err as { status?: unknown; statusCode?: unknown })?.status ?? (err as { statusCode?: unknown })?.statusCode;
  return typeof status === 'number' && status >= 400 && status < 600 ? status : 500;
}

function typeOf(err: unknown): string {
  const type = (err as { type?: unknown })?.type;
  if (typeof type === 'string') return type;
  return err instanceof Error ? err.name : 'unknown';
}

/** Last middleware (02 §8). */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = statusOf(err);

  if (status < 500) {
    const type = typeOf(err);
    // Status and type only: the body, the message and the error object can carry what the
    // client sent, which may be part of a password.
    console.warn(`Client error: ${status} ${type}`);
    // No other client status reaches this handler today; a new one gets its code in 02 §7 first.
    const code = CLIENT_ERROR_CODES[status] ?? 'VALIDATION';
    res.status(status).json({ error: { code, message: clientMessage(status, type) } });
    return;
  }

  console.error(err instanceof Error ? err.stack : 'Non-Error value thrown');
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
};
