// Twelve Data's Basic plan allows 8 credits per minute and 800 per day (02 §5.1).
// We stay one below the minute limit and well below the daily one, as a margin (02 §5.3).
export const MINUTE_CAP = 7;
export const DAILY_CREDIT_CAP = 750;
const WINDOW_MS = 60_000;

/** The per-day counter. Production keeps it in the `api_usage` table, because the host restarts the process often. */
export type DailyCounter = { tryIncrement(day: string, cap: number): Promise<boolean> };

/** Thrown by `acquire()`: waiting for the next UTC day is not an option for a script. */
export class DailyBudgetExhaustedError extends Error {
  override name = 'DailyBudgetExhaustedError';
}

export type CreditBudgetDeps = {
  /** Milliseconds since the epoch; tests pass a fake one. */
  clock: () => number;
  daily: DailyCounter;
  sleep?: (ms: number) => Promise<void>;
};

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The UTC day of a timestamp, as stored in `api_usage.day`. */
function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * One instance per process (02 §5.3). The minute window lives in memory and is per process:
 * the seed run from a laptop and the deployed server do not see each other's minute usage.
 */
export function createCreditBudget(deps: CreditBudgetDeps) {
  const sleep = deps.sleep ?? realSleep;
  // When each credit of the last 60 seconds was spent, oldest first.
  const spentAt: number[] = [];

  function dropExpired(now: number) {
    while (spentAt.length > 0 && now - spentAt[0] >= WINDOW_MS) spentAt.shift();
  }

  /**
   * Takes one credit if both caps allow it. The minute slot is reserved before the daily counter
   * is asked, so two calls running at once cannot both squeeze into the last slot; it is handed
   * back when the day refuses.
   */
  async function take(now: number): Promise<'ok' | 'minute' | 'day'> {
    dropExpired(now);
    if (spentAt.length >= MINUTE_CAP) return 'minute';
    spentAt.push(now);
    if (await deps.daily.tryIncrement(utcDay(now), DAILY_CREDIT_CAP)) return 'ok';
    spentAt.splice(spentAt.indexOf(now), 1);
    return 'day';
  }

  return {
    /** For user-facing calls: answers at once and never waits. */
    async tryAcquire(): Promise<boolean> {
      return (await take(deps.clock())) === 'ok';
    },

    /** For the seed: waits for the next free minute slot; throws when the day is used up. */
    async acquire(): Promise<void> {
      for (;;) {
        const now = deps.clock();
        const result = await take(now);
        if (result === 'ok') return;
        if (result === 'day') {
          throw new DailyBudgetExhaustedError(`daily cap of ${DAILY_CREDIT_CAP} credits reached for ${utcDay(now)} (UTC)`);
        }
        await sleep(spentAt[0] + WINDOW_MS - now);
      }
    },
  };
}
