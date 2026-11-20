import type pg from 'pg';

export function symbolsRepository(pool: pg.Pool) {
  return {
    async countReady(): Promise<number> {
      const { rows } = await pool.query<{ n: number }>(
        "select count(*)::int as n from symbols where status = 'ready'",
      );
      return rows[0].n;
    },
  };
}
