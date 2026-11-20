import type pg from 'pg';
import type { DailyClose } from '../marketdata/provider.js';

// Dates come back as `YYYY-MM-DD` text and closes as float8 numbers: pg would turn a `date` into
// a JavaScript Date at local midnight, which can shift the day, and a `numeric` into a string.
const BAR = 'd::text as d, close::float8 as close';

/** The reads the rounds need; the seed uses `replaceSeries`. */
export type ClosesReads = {
  /** The whole series, oldest first. */
  series(symbol: string): Promise<DailyClose[]>;
  /** The last `count` closes up to and including `cutoffDate`, oldest first. */
  upTo(symbol: string, cutoffDate: string, count: number): Promise<DailyClose[]>;
  /** The first `count` closes after `cutoffDate`, oldest first. */
  after(symbol: string, cutoffDate: string, count: number): Promise<DailyClose[]>;
};

export function closesRepository(pool: pg.Pool) {
  return {
    async series(symbol: string): Promise<DailyClose[]> {
      const { rows } = await pool.query<DailyClose>(`select ${BAR} from daily_closes where symbol = $1 order by d`, [symbol]);
      return rows;
    },

    async upTo(symbol: string, cutoffDate: string, count: number): Promise<DailyClose[]> {
      // The newest `count` rows up to the cutoff, then put back in date order. Always `count` rows,
      // so resuming a round costs the same whatever the length of the stock's history (anonymity V12).
      const { rows } = await pool.query<DailyClose>(
        `select d, close from (
           select ${BAR} from daily_closes where symbol = $1 and d <= $2 order by d desc limit $3
         ) as window order by d`,
        [symbol, cutoffDate, count],
      );
      return rows;
    },

    async after(symbol: string, cutoffDate: string, count: number): Promise<DailyClose[]> {
      const { rows } = await pool.query<DailyClose>(
        `select ${BAR} from daily_closes where symbol = $1 and d > $2 order by d limit $3`,
        [symbol, cutoffDate, count],
      );
      return rows;
    },

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
