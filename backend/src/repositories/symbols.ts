import type pg from 'pg';

export function symbolsRepository(pool: pg.Pool) {
  return {
    async countReady(): Promise<number> {
      const { rows } = await pool.query<{ n: number }>(
        "select count(*)::int as n from symbols where status = 'ready'",
      );
      return rows[0].n;
    },

    /** A response was rejected or the provider could not serve it (02 §5.2, §5.5). A later seed run tries again. */
    async markFailed(symbol: string): Promise<void> {
      await pool.query("update symbols set status = 'failed' where symbol = $1", [symbol]);
    },
  };
}
