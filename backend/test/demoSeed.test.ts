import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/domain/coin.js';
import { demoConfig, runDemoSeed, type DemoConfig } from '../src/services/demoSeed.js';
import { inMemoryMarket, inMemoryRounds, inMemoryUsers } from './fakeDeps.js';

const CONFIG: DemoConfig = { email: 'demo@guess-up.test', password: 'demo-password', reset: false };

function setup(market = inMemoryMarket()) {
  const users = inMemoryUsers();
  const rounds = inMemoryRounds();
  const deps = { users, rounds, symbols: market.symbols, closes: market.closes, random: mulberry32(1) };
  const roundsOf = (userId: string) => [...rounds.rows.values()].filter((row) => row.userId === userId);
  const demoUser = () => [...users.rows.values()].find((row) => row.email === CONFIG.email);
  return { users, rounds, deps, roundsOf, demoUser };
}

describe('runDemoSeed (02 §5.5)', () => {
  it('creates the demo user and leaves exactly 40 decided rounds and none open', async () => {
    const { deps, roundsOf, demoUser } = setup();
    const result = await runDemoSeed(deps, CONFIG);

    const user = demoUser();
    expect(user?.isDemo).toBe(true);
    const rows = roundsOf(user!.id);
    expect(rows.filter((row) => row.decision !== null)).toHaveLength(40);
    expect(rows.filter((row) => row.decision === null)).toHaveLength(0);
    expect(result).toEqual({ userId: user!.id, created: true, removed: 0, added: 40, decided: 40 });
  });

  it('run twice, it still leaves 40', async () => {
    const { deps, roundsOf, demoUser } = setup();
    await runDemoSeed(deps, CONFIG);
    const second = await runDemoSeed(deps, CONFIG);

    expect(roundsOf(demoUser()!.id)).toHaveLength(40);
    expect(second).toMatchObject({ created: false, removed: 0, added: 0, decided: 40 });
  });

  it('with --reset, deletes every round of the demo user, an open one too, and leaves 40 new ones', async () => {
    const { deps, rounds, roundsOf, demoUser } = setup();
    await runDemoSeed(deps, CONFIG);
    const userId = demoUser()!.id;
    // Someone played two more charts on the demo account and left a third one open.
    for (let i = 0; i < 2; i++) {
      const id = await rounds.insertOpen({ userId, symbol: 'ZZQX', cutoffDate: '2011-06-01', forwardReturn: 0.01 });
      await rounds.decide(id!, userId, 'buy');
    }
    await rounds.insertOpen({ userId, symbol: 'ZZQX', cutoffDate: '2011-07-01', forwardReturn: 0.02 });
    const before = new Set(roundsOf(userId).map((row) => row.id));

    const result = await runDemoSeed(deps, { ...CONFIG, reset: true });

    const after = roundsOf(userId);
    expect(after.filter((row) => row.decision !== null)).toHaveLength(40);
    expect(after.filter((row) => row.decision === null)).toHaveLength(0);
    expect(after.some((row) => before.has(row.id))).toBe(false);
    expect(result).toMatchObject({ created: false, removed: 43, added: 40, decided: 40 });
  });

  it('decides with a seeded coin: two fresh runs make the same decisions, with buys and passes', async () => {
    const decisionsOf = async (picking: number) => {
      const { deps, roundsOf, demoUser } = setup();
      await runDemoSeed({ ...deps, random: mulberry32(picking) }, CONFIG);
      return roundsOf(demoUser()!.id).map((row) => row.decision);
    };
    const first = await decisionsOf(1);
    expect(await decisionsOf(2)).toEqual(first);
    expect(first).toContain('buy');
    expect(first).toContain('pass');
  });

  it('without a ready stock, stops with a clear message and creates nothing', async () => {
    const { users, rounds, deps } = setup(inMemoryMarket([]));
    await expect(runDemoSeed(deps, CONFIG)).rejects.toThrow('No stock is ready yet: run pnpm seed first. Nothing was created.');
    expect(users.rows.size).toBe(0);
    expect(rounds.rows.size).toBe(0);
  });

  it('never touches an account that is not the demo account', async () => {
    const { users, rounds, deps } = setup();
    const ordinary = await users.create(CONFIG.email, 'some-hash');
    const id = await rounds.insertOpen({ userId: ordinary!.id, symbol: 'ZZQX', cutoffDate: '2011-06-01', forwardReturn: 0.01 });

    await expect(runDemoSeed(deps, { ...CONFIG, reset: true })).rejects.toThrow(
      'DEMO_EMAIL belongs to an account that is not the demo account. Nothing was changed.',
    );
    expect(users.rows.get(ordinary!.id)?.isDemo).toBe(false);
    expect([...rounds.rows.keys()]).toEqual([id]);
  });
});

describe('demoConfig', () => {
  const env = { DEMO_EMAIL: 'demo@guess-up.test', DEMO_PASSWORD: 'demo-password' };

  it('does not start without DEMO_EMAIL or without DEMO_PASSWORD', () => {
    expect(() => demoConfig({ DEMO_PASSWORD: env.DEMO_PASSWORD }, [])).toThrow('Missing environment variables: DEMO_EMAIL.');
    expect(() => demoConfig({ DEMO_EMAIL: env.DEMO_EMAIL }, [])).toThrow('Missing environment variables: DEMO_PASSWORD.');
    expect(() => demoConfig({ DEMO_EMAIL: '', DEMO_PASSWORD: '' }, [])).toThrow('Missing environment variables: DEMO_EMAIL, DEMO_PASSWORD.');
  });

  it('does not start with credentials that /auth would reject', () => {
    expect(() => demoConfig({ ...env, DEMO_EMAIL: 'not-an-email' }, [])).toThrow('DEMO_EMAIL does not pass the /auth rules');
    expect(() => demoConfig({ ...env, DEMO_PASSWORD: 'short' }, [])).toThrow('DEMO_PASSWORD does not pass the /auth rules');
  });

  it('normalises the email as /auth does, and reads --reset', () => {
    expect(demoConfig({ ...env, DEMO_EMAIL: ' Demo@Guess-Up.Test ' }, [])).toEqual({ ...CONFIG, reset: false });
    expect(demoConfig(env, ['--reset'])).toEqual({ ...CONFIG, reset: true });
  });

  it('refuses any other argument', () => {
    expect(() => demoConfig(env, ['--force'])).toThrow('Usage: pnpm seed:demo [--reset]');
  });
});
