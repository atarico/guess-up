import { describe, expect, it } from 'vitest';
import {
  DAILY_CREDIT_CAP,
  DailyBudgetExhaustedError,
  MINUTE_CAP,
  createCreditBudget,
  type DailyCounter,
} from '../src/marketdata/creditBudget.js';

const T0 = Date.parse('2026-11-20T12:00:00.000Z');

/** A clock the test moves by hand, and a sleep that only moves that clock. */
function fakeTime(start = T0) {
  let now = start;
  const sleeps: number[] = [];
  return {
    clock: () => now,
    advance: (ms: number) => {
      now += ms;
    },
    sleep: async (ms: number) => {
      sleeps.push(ms);
      now += ms;
    },
    sleeps,
  };
}

/** The `api_usage` table, in memory: credits per UTC day, incremented only below the cap. */
function memoryDaily(initial: Record<string, number> = {}) {
  const credits = new Map(Object.entries(initial));
  const daily: DailyCounter = {
    async tryIncrement(day, cap) {
      const used = credits.get(day) ?? 0;
      if (used >= cap) return false;
      credits.set(day, used + 1);
      return true;
    },
  };
  return { daily, credits };
}

async function spend(budget: { tryAcquire(): Promise<boolean> }, n: number) {
  const results: boolean[] = [];
  for (let i = 0; i < n; i++) results.push(await budget.tryAcquire());
  return results;
}

describe('credit budget, per minute (02 §5.3)', () => {
  it('allows 7 credits in a 60-second window and refuses the 8th at once', async () => {
    const time = fakeTime();
    const { daily, credits } = memoryDaily();
    const budget = createCreditBudget({ clock: time.clock, daily, sleep: time.sleep });

    expect(await spend(budget, MINUTE_CAP)).toEqual(Array(7).fill(true));
    expect(await budget.tryAcquire()).toBe(false);
    expect(time.sleeps).toEqual([]);
    expect(credits.get('2026-11-20')).toBe(7);
  });

  it('frees a credit exactly 60 seconds after it was spent: the window slides', async () => {
    const time = fakeTime();
    const budget = createCreditBudget({ clock: time.clock, daily: memoryDaily().daily, sleep: time.sleep });

    await spend(budget, 4); // at 0 s
    time.advance(30_000);
    await spend(budget, 3); // at 30 s
    time.advance(29_999); // 59.999 s
    expect(await budget.tryAcquire()).toBe(false);
    time.advance(1); // 60 s: the four from 0 s leave the window
    expect(await spend(budget, 4)).toEqual([true, true, true, true]);
    expect(await budget.tryAcquire()).toBe(false);
  });

  it('acquire() waits for the oldest credit to leave the window instead of failing', async () => {
    const time = fakeTime();
    const budget = createCreditBudget({ clock: time.clock, daily: memoryDaily().daily, sleep: time.sleep });

    await spend(budget, 7);
    time.advance(10_000);
    await budget.acquire();
    expect(time.sleeps).toEqual([50_000]);
  });
});

describe('credit budget, per day (02 §5.3)', () => {
  it('counts credits per UTC day, so a new day starts at zero', async () => {
    const time = fakeTime(Date.parse('2026-11-20T23:59:59.000Z'));
    const { daily, credits } = memoryDaily();
    const budget = createCreditBudget({ clock: time.clock, daily, sleep: time.sleep });

    await budget.tryAcquire();
    time.advance(2_000);
    await budget.tryAcquire();
    expect(Object.fromEntries(credits)).toEqual({ '2026-11-20': 1, '2026-11-21': 1 });
  });

  it('refuses at the daily cap: tryAcquire() returns false and acquire() throws without waiting', async () => {
    const time = fakeTime();
    const budget = createCreditBudget({
      clock: time.clock,
      daily: memoryDaily({ '2026-11-20': DAILY_CREDIT_CAP }).daily,
      sleep: time.sleep,
    });

    expect(await budget.tryAcquire()).toBe(false);
    await expect(budget.acquire()).rejects.toBeInstanceOf(DailyBudgetExhaustedError);
    expect(time.sleeps).toEqual([]);
  });

  it('does not use a minute slot when the daily cap refuses the credit', async () => {
    const time = fakeTime();
    const { daily } = memoryDaily({ '2026-11-20': DAILY_CREDIT_CAP - 1 });
    const budget = createCreditBudget({ clock: time.clock, daily, sleep: time.sleep });

    expect(await budget.tryAcquire()).toBe(true); // the last credit of the day
    expect(await spend(budget, 3)).toEqual([false, false, false]);
    time.advance(86_400_000); // next UTC day, the minute window long empty
    expect(await spend(budget, MINUTE_CAP)).toEqual(Array(7).fill(true));
  });
});
