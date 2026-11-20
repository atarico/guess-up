// The backend contract, mirrored by hand from 02-backend.md §4 and §7.

/** The user object, the same everywhere it is returned (02 §4). */
export type User = { id: string; email: string; isDemo: boolean };

/** `POST /auth/register` (201) and `POST /auth/login` (200). */
export type AuthResponse = { token: string; user: User };

/** `GET /auth/me`. */
export type MeResponse = { user: User };

/** Every `error.code` of 02 §7. */
export type ErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'NOT_FOUND'
  | 'EMAIL_TAKEN'
  | 'ROUND_OPEN'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'NO_DATA'
  | 'INTERNAL';
