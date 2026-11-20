// The backend contract, mirrored by hand from 02-backend.md §4 and §7.

/** The user object, the same everywhere it is returned (02 §4). */
export type User = { id: string; email: string; isDemo: boolean };

/** `POST /auth/register` (201) and `POST /auth/login` (200). */
export type AuthResponse = { token: string; user: User };

/** `GET /auth/me`. */
export type MeResponse = { user: User };

/** `POST /rounds`: before the decision, only the id, 252 points in [0, 1] and `resumed` (02 §7). */
export type RoundResponse = { round: { id: string; points: number[] }; resumed: boolean };

/** One daily close in the reveal. */
export type Bar = { d: string; c: number };

/** Everything `POST /rounds/:id/decision` reveals (02 §7). */
export type Reveal = {
  symbol: string;
  name: string;
  sector: string | null;
  exchange: string | null;
  startDate: string;
  cutoffDate: string;
  endDate: string;
  history: Bar[];
  future: Bar[];
  forwardReturn: number;
  decision: 'buy' | 'pass';
  correct: boolean;
};

export type DecisionResponse = { reveal: Reveal; streak: { current: number; best: number } };

/** (P1) `GET /rounds/:id/live` (02 §7): the price is a nice-to-have, so a missing one is a normal answer. */
export type LiveQuote =
  | { available: true; price: number; asOf: string; sinceCutoff: number }
  | { available: false; reason: 'limit' | 'unavailable' };

export type LiveResponse = { live: LiveQuote };

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

/** `GET /stats` (02 §7). Returns are decimals; null where a figure is undefined. */
/**
 * The coin's 2,000 edges in 40 equal bins, from the smallest edge (`start`) by `width`; every edge is
 * counted once, the largest in the last bin. `width` is 0 when every edge is equal (02 §7).
 */
export type CoinHistogram = { start: number; width: number; counts: number[] };

export type StatsResponse = {
  rounds: number;
  buys: number;
  passes: number;
  avgPicks: number | null;
  avgAll: number | null;
  avgPassed: number | null;
  edge: number | null;
  coin: { p5: number; p95: number; percentile: number; beatenBy: number; trials: number; histogram: CoinHistogram } | null;
  verdict: 'insufficient' | 'bought_none' | 'bought_all' | 'worse' | 'better' | 'coin';
  roundsUntilVerdict: number;
  hitRate: number | null;
  streak: { current: number; best: number };
};

/** (P1) One of the caller's decided rounds, for the last-20 list (02 §7, `GET /rounds?limit=20`). */
export type RecentRound = {
  id: string;
  symbol: string;
  name: string;
  cutoffDate: string;
  decision: 'buy' | 'pass';
  forwardReturn: number;
  correct: boolean;
  decidedAt: string;
};

export type RecentRoundsResponse = { rounds: RecentRound[] };
