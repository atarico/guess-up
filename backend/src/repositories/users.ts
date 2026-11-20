import type pg from 'pg';

/** The user object of 02 §4, the only shape any response carries. */
export type User = { id: string; email: string; isDemo: boolean };

/** Only the login needs the hash; it never leaves the service. */
export type UserWithHash = User & { passwordHash: string };

export type UsersRepository = {
  /** `null` when the email is taken: the unique index decides, so two sign-ups cannot race past a lookup. */
  create(email: string, passwordHash: string): Promise<User | null>;
  findByEmail(email: string): Promise<UserWithHash | null>;
  findById(id: string): Promise<User | null>;
};

export function usersRepository(pool: pg.Pool): UsersRepository {
  return {
    async create(email, passwordHash) {
      const { rows } = await pool.query<User>(
        `insert into users (email, password_hash) values ($1, $2)
         on conflict (email) do nothing
         returning id, email, is_demo as "isDemo"`,
        [email, passwordHash],
      );
      return rows[0] ?? null;
    },

    async findByEmail(email) {
      const { rows } = await pool.query<UserWithHash>(
        `select id, email, is_demo as "isDemo", password_hash as "passwordHash" from users where email = $1`,
        [email],
      );
      return rows[0] ?? null;
    },

    async findById(id) {
      const { rows } = await pool.query<User>('select id, email, is_demo as "isDemo" from users where id = $1', [id]);
      return rows[0] ?? null;
    },
  };
}
