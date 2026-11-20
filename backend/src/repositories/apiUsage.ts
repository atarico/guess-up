import type pg from 'pg';
import type { DailyCounter } from '../marketdata/creditBudget.js';

export function apiUsageRepository(pool: pg.Pool) {
  const dailyCounter: DailyCounter = {
    /**
     * Adds one credit to `day` only while it is below `cap`, in one statement, so two processes
     * cannot both take the last credit. False when the cap is reached.
     */
    async tryIncrement(day, cap) {
      const { rowCount } = await pool.query(
        `insert into api_usage (day, credits) values ($1, 1)
         on conflict (day) do update set credits = api_usage.credits + 1
         where api_usage.credits < $2`,
        [day, cap],
      );
      return rowCount === 1;
    },
  };

  return {
    ...dailyCounter,

    /** Credits spent today. `api_usage.day` is the UTC day, like the provider's daily reset (02 §3). */
    async usedToday(): Promise<number> {
      const { rows } = await pool.query<{ credits: number }>(
        "select credits from api_usage where day = (now() at time zone 'utc')::date",
      );
      return rows[0]?.credits ?? 0;
    },
  };
}
