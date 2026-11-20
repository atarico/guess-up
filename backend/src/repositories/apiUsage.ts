import type pg from 'pg';

export function apiUsageRepository(pool: pg.Pool) {
  return {
    /** Credits spent today. `api_usage.day` is the UTC day, like the provider's daily reset (02 §3). */
    async usedToday(): Promise<number> {
      const { rows } = await pool.query<{ credits: number }>(
        "select credits from api_usage where day = (now() at time zone 'utc')::date",
      );
      return rows[0]?.credits ?? 0;
    },
  };
}
