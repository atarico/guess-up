import { mulberry32 } from '../domain/coin.js';
import type { ClosesReads } from '../repositories/closes.js';
import type { RoundsRepository } from '../repositories/rounds.js';
import type { SymbolReads } from '../repositories/symbols.js';
import type { UsersRepository } from '../repositories/users.js';
import { credentials, hashPassword } from './authService.js';
import { roundService } from './roundService.js';

// pnpm seed:demo (02 §5.5): the demo account, with a history a reviewer can judge without playing.

/** Decided rounds the demo account is topped up to. */
export const DEMO_ROUNDS = 40;

/**
 * The coin's seed is fixed, so every run makes the same decisions. The charts are still picked with
 * Math.random, as in play, so `--reset` gives new charts and possibly a different verdict.
 */
const DEMO_COIN_SEED = 7;

export type DemoConfig = { email: string; password: string; reset: boolean };

/**
 * Reads DEMO_EMAIL, DEMO_PASSWORD and the arguments, and checks the credentials with the /auth rules,
 * so the stored account can be used to log in. Throws before anything else runs. Errors name the
 * variables, never their values.
 */
export function demoConfig(env: Record<string, string | undefined>, args: string[]): DemoConfig {
  if (args.length > 1 || (args.length === 1 && args[0] !== '--reset')) throw new Error('Usage: pnpm seed:demo [--reset]');

  const missing = ['DEMO_EMAIL', 'DEMO_PASSWORD'].filter((name) => !env[name]);
  if (missing.length > 0) throw new Error(`Missing environment variables: ${missing.join(', ')}. Add them to backend/.env.`);

  const parsed = credentials.safeParse({ email: env.DEMO_EMAIL, password: env.DEMO_PASSWORD });
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((issue) => (issue.path[0] === 'email' ? 'DEMO_EMAIL' : 'DEMO_PASSWORD')))];
    throw new Error(`${names.join(' and ')} does not pass the /auth rules: a valid email, and a password of at least 8 characters and at most 72 bytes.`);
  }
  return { ...parsed.data, reset: args[0] === '--reset' };
}

type Deps = {
  users: Pick<UsersRepository, 'create' | 'findByEmail'>;
  rounds: RoundsRepository;
  symbols: SymbolReads;
  closes: ClosesReads;
  /** Picks the charts: Math.random in the script, seeded in tests. */
  random: () => number;
};

export type DemoSeedResult = { userId: string; created: boolean; removed: number; added: number; decided: number };

/**
 * Creates the demo user if missing and tops its history up to 40 decided rounds, each one opened and
 * decided through roundService, the same rules as play. `reset` deletes its rounds first.
 */
export async function runDemoSeed(deps: Deps, config: DemoConfig): Promise<DemoSeedResult> {
  // Checked before any write: without a ready stock no round can be made, so nothing is created.
  if ((await deps.symbols.countReady()) === 0) throw new Error('No stock is ready yet: run pnpm seed first. Nothing was created.');

  const existing = await deps.users.findByEmail(config.email);
  // --reset deletes rounds, so an ordinary account that shares the email must never get this far.
  if (existing && !existing.isDemo) {
    throw new Error('DEMO_EMAIL belongs to an account that is not the demo account. Nothing was changed.');
  }
  const user = existing ?? (await deps.users.create(config.email, await hashPassword(config.password), true));
  if (!user) throw new Error('The demo user could not be created: the email was taken while the script ran.');

  const removed = config.reset ? await deps.rounds.deleteForUser(user.id) : 0;

  const play = roundService(deps);
  const coin = mulberry32(DEMO_COIN_SEED);
  let decided = (await deps.rounds.decidedInOrder(user.id)).length;
  let added = 0;
  while (decided < DEMO_ROUNDS) {
    // An open round someone left on the account comes back first and is decided: no rerolls here either.
    const round = await play.createOrResume(user.id);
    await play.decide(user.id, round.id, coin() < 0.5 ? 'buy' : 'pass');
    decided += 1;
    added += 1;
  }
  return { userId: user.id, created: !existing, removed, added, decided };
}
