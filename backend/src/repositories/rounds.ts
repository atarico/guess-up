import type pg from 'pg';
import type { DecidedRound, Decision } from '../domain/stats.js';

/** An open round as the server keeps it. Never sent to the client before the decision (01 §6). */
export type OpenRound = { id: string; symbol: string; cutoffDate: string };

export type StoredRound = OpenRound & { forwardReturn: number; decision: Decision | null };

export type NewRound = { userId: string; symbol: string; cutoffDate: string; forwardReturn: number };

export type RoundsRepository = {
  findOpen(userId: string): Promise<OpenRound | null>;
  /**
   * Returns the new id, or null when the user already has an open round. The partial unique
   * index `one_open_round_per_user` decides, so two requests at once cannot both open one.
   */
  insertOpen(round: NewRound): Promise<string | null>;
  /** Records the decision on the user's own open round; null when no such open round exists. */
  decide(id: string, userId: string, decision: Decision): Promise<StoredRound | null>;
  /** The user's own round, open or decided; null for an unknown id or someone else's round. */
  findOwn(id: string, userId: string): Promise<StoredRound | null>;
  /** The user's decided rounds in the order they were decided, for the streak. */
  decidedInOrder(userId: string): Promise<DecidedRound[]>;
  /** Deletes every round of the user, open or decided, and returns how many; only `pnpm seed:demo --reset` calls it. */
  deleteForUser(userId: string): Promise<number>;
};

const STORED = `id, symbol, cutoff_date::text as "cutoffDate", forward_return::float8 as "forwardReturn", decision`;

export function roundsRepository(pool: pg.Pool): RoundsRepository {
  return {
    async findOpen(userId) {
      const { rows } = await pool.query<OpenRound>(
        `select id, symbol, cutoff_date::text as "cutoffDate" from rounds where user_id = $1 and decision is null`,
        [userId],
      );
      return rows[0] ?? null;
    },

    async insertOpen({ userId, symbol, cutoffDate, forwardReturn }) {
      // `on conflict (user_id) where decision is null` names the partial unique index, so the
      // losing insert of a race returns no row instead of an error.
      const { rows } = await pool.query<{ id: string }>(
        `insert into rounds (user_id, symbol, cutoff_date, forward_return) values ($1, $2, $3, $4)
         on conflict (user_id) where decision is null do nothing
         returning id`,
        [userId, symbol, cutoffDate, forwardReturn],
      );
      return rows[0]?.id ?? null;
    },

    async decide(id, userId, decision) {
      const { rows } = await pool.query<StoredRound>(
        `update rounds set decision = $3, decided_at = now()
          where id = $1 and user_id = $2 and decision is null
          returning ${STORED}`,
        [id, userId, decision],
      );
      return rows[0] ?? null;
    },

    async findOwn(id, userId) {
      const { rows } = await pool.query<StoredRound>(`select ${STORED} from rounds where id = $1 and user_id = $2`, [id, userId]);
      return rows[0] ?? null;
    },

    async decidedInOrder(userId) {
      const { rows } = await pool.query<DecidedRound>(
        `select decision, forward_return::float8 as r from rounds
          where user_id = $1 and decision is not null
          order by decided_at, created_at`,
        [userId],
      );
      return rows;
    },

    async deleteForUser(userId) {
      const { rowCount } = await pool.query('delete from rounds where user_id = $1', [userId]);
      return rowCount ?? 0;
    },
  };
}
