import type pg from 'pg';
import type { DailyClose } from '../marketdata/provider.js';

export function closesRepository(pool: pg.Pool) {
  return {
    /**
     * Replaces a symbol's whole series with one snapshot, in one transaction (02 §5.2): delete its
     * rows, insert the new ones, mark the symbol `ready`. Never appends to old bars, because two
     * adjustment bases mixed in one series would draw a fake cliff in the chart.
     */
    async replaceSeries(symbol: string, exchange: string | null, bars: DailyClose[]): Promise<void> {
      if (bars.length === 0) throw new Error(`refusing to store an empty series for ${symbol}`);
      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query('delete from daily_closes where symbol = $1', [symbol]);
        // All bars in one statement: two arrays unnested side by side into rows.
        await client.query(
          `insert into daily_closes (symbol, d, close)
           select $1, t.d, t.close from unnest($2::date[], $3::numeric[]) as t(d, close)`,
          [symbol, bars.map((bar) => bar.d), bars.map((bar) => bar.close)],
        );
        const updated = await client.query(
          `update symbols
              set status = 'ready', bars = $2, first_date = $3, last_date = $4, exchange = $5, fetched_at = now()
            where symbol = $1`,
          [symbol, bars.length, bars[0].d, bars[bars.length - 1].d, exchange],
        );
        if (updated.rowCount !== 1) throw new Error(`symbol ${symbol} is not in the symbols table`);
        await client.query('commit');
      } catch (err) {
        await client.query('rollback');
        throw err;
      } finally {
        client.release();
      }
    },
  };
}
