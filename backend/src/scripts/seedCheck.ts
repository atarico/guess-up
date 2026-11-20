import { createPool } from '../db.js';

// pnpm seed:check: a read-only report after seeding (02 §5.5). Everything runs inside a
// read-only transaction, so it cannot change the database even by mistake.
//   1. symbols by status (ready, failed, pending)
//   2. per symbol: status, bars stored and their date range
//   3. day-to-day moves above 40%, which usually mean a corporate action the split
//      adjustment did not undo (a spin-off, 01 §12) rather than a real move

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add it to backend/.env.');
  process.exit(1);
}

const JUMP_THRESHOLD = 0.4;
const pool = createPool(databaseUrl);
const client = await pool.connect();
try {
  await client.query('begin read only');

  const byStatus = await client.query('select status, count(*)::int as symbols from symbols group by status order by status');
  console.log('Symbols by status');
  console.table(byStatus.rows);

  const perSymbol = await client.query(
    `select s.symbol, s.status, count(c.d)::int as bars, min(c.d)::text as first_day, max(c.d)::text as last_day
       from symbols s left join daily_closes c on c.symbol = s.symbol
      group by s.symbol, s.status
      order by s.status, s.symbol`,
  );
  console.log('Bars per symbol');
  console.table(perSymbol.rows);

  const jumps = await client.query(
    `select symbol, previous_day, d::text as day, previous_close::text, close::text,
            round((close / previous_close - 1) * 100, 1)::text as change_pct
       from (select symbol, d, close,
                    lag(close) over w as previous_close,
                    lag(d) over w :: text as previous_day
               from daily_closes
             window w as (partition by symbol order by d)) t
      where previous_close is not null and abs(close / previous_close - 1) > $1
      order by symbol, d`,
    [JUMP_THRESHOLD],
  );
  console.log(`Day-to-day moves above ${JUMP_THRESHOLD * 100}%: ${jumps.rowCount}`);
  if (jumps.rowCount) console.table(jumps.rows);

  await client.query('commit');
} finally {
  client.release();
  await pool.end();
}
