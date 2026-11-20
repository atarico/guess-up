import type { StatsResponse } from './api-types';
import { copy, type Part } from './copy';

/** What can change the number of charts left before the first verdict. */
export type ProgressEvent =
  | { kind: 'stats'; roundsUntilVerdict: number; decidedSinceAsked: boolean } // GET /stats answered
  | { kind: 'statsFailed' }
  | { kind: 'decided' }; // a decision was recorded

/**
 * Charts left before the first verdict (03 §5.3), or null when not known, and then nothing is shown.
 * It starts from `roundsUntilVerdict` and goes down with each recorded decision. Like the chart number
 * (chartNumber.ts), an answer asked before a decision was sent is dropped: it may or may not count it.
 */
export function remainingAfter(current: number | null, event: ProgressEvent): number | null {
  switch (event.kind) {
    case 'stats':
      return event.decidedSinceAsked ? current : event.roundsUntilVerdict;
    case 'statsFailed':
      return current;
    case 'decided':
      return current === null ? null : Math.max(0, current - 1);
  }
}

/** The line under the question while charts are left; gone at ten decided charts, or while unknown. */
export function progressParts(remaining: number | null): Part[] | null {
  return remaining === null || remaining <= 0 ? null : copy.stats.verdict.remaining(remaining);
}

/**
 * Whether the reveal shows that the first verdict is ready: this decision left no chart to go, and
 * GET /stats, asked after it, has a verdict against the coin. With every chart bought or every chart
 * passed there is none, so the notice would point at a verdict that is not there.
 */
export function verdictReady(remainingBefore: number | null, verdict: StatsResponse['verdict']): boolean {
  return remainingBefore === 1 && (verdict === 'coin' || verdict === 'better' || verdict === 'worse');
}
