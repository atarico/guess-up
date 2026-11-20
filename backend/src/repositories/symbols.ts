import type pg from 'pg';
import type { UniverseEntry } from '../data/universe.js';

/** What the reveal shows about a stock (01 §7). */
export type SymbolInfo = { symbol: string; name: string; sector: string | null; exchange: string | null };

/** The reads the server needs; the seed uses the writes below. */
export type SymbolReads = {
  countReady(): Promise<number>;
  listReady(): Promise<string[]>;
  find(symbol: string): Promise<SymbolInfo | null>;
};

export function symbolsRepository(pool: pg.Pool) {
  return {
    async listReady(): Promise<string[]> {
      const { rows } = await pool.query<{ symbol: string }>(
        "select symbol from symbols where status = 'ready' order by symbol",
      );
      return rows.map((row) => row.symbol);
    },

    async find(symbol: string): Promise<SymbolInfo | null> {
      const { rows } = await pool.query<SymbolInfo>(
        'select symbol, name, sector, exchange from symbols where symbol = $1',
        [symbol],
      );
      return rows[0] ?? null;
    },

    /**
     * Inserts each universe entry as `pending`, or updates its name and sector; a symbol that is
     * already `ready` keeps its status and its series (02 §5.5). One statement for the whole list.
     */
    async upsertUniverse(entries: UniverseEntry[]): Promise<void> {
      await pool.query(
        `insert into symbols (symbol, name, sector)
         select * from unnest($1::text[], $2::text[], $3::text[])
         on conflict (symbol) do update set name = excluded.name, sector = excluded.sector`,
        [entries.map((e) => e.symbol), entries.map((e) => e.name), entries.map((e) => e.sector)],
      );
    },

    async statusOf(symbols: string[]): Promise<Map<string, string>> {
      const { rows } = await pool.query<{ symbol: string; status: string }>(
        'select symbol, status from symbols where symbol = any($1)',
        [symbols],
      );
      return new Map(rows.map((row) => [row.symbol, row.status]));
    },

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
