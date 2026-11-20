'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CoinRange } from '@/components/CoinRange';
import { Sentence } from '@/components/Sentence';
import { Verdict } from '@/components/Verdict';
import { api } from '@/lib/api';
import type { MeResponse, StatsResponse } from '@/lib/api-types';
import { useAuth } from '@/lib/auth';
import { copy } from '@/lib/copy';
import { percent, share } from '@/lib/format';
import { coinParts, verdictParts } from '@/lib/verdict';

type View = { kind: 'loading' } | { kind: 'ready'; stats: StatsResponse; isDemo: boolean } | { kind: 'error' };

const orMissing = (value: number | null, format: (v: number) => string) => (value === null ? copy.statsScreen.missing : format(value));

/** The scoreboard (03 §5.4), top to bottom, without the (P1) list. */
export function StatsScreen() {
  const auth = useAuth();
  const router = useRouter();
  const token = auth.status === 'signedIn' ? auth.token : null;
  const [view, setView] = useState<View>({ kind: 'loading' });

  /**
   * The figures, and whether this is the demo account: the client keeps only the token (03 §7), so
   * GET /auth/me says it. Both are awaited, so the banner never appears after the verdict; if
   * /auth/me fails, there is simply no banner.
   */
  const fetchStats = useCallback(
    (bearer: string): Promise<View> =>
      Promise.all([
        api<StatsResponse>('/stats', { token: bearer }),
        api<MeResponse>('/auth/me', { token: bearer }).then(
          ({ user }) => user.isDemo,
          () => false,
        ),
      ]).then(
        ([stats, isDemo]): View => ({ kind: 'ready', stats, isDemo }),
        (): View => ({ kind: 'error' }),
      ),
    [],
  );

  // No token: plain /login, no notice (03 §7). A rejected token is handled by api.ts.
  useEffect(() => {
    if (auth.status === 'signedOut') router.replace('/login');
  }, [auth.status, router]);

  useEffect(() => {
    if (!token) return;
    let current = true;
    fetchStats(token).then((next) => current && setView(next));
    return () => {
      current = false;
    };
  }, [token, fetchStats]);

  function retry() {
    if (!token) return;
    setView({ kind: 'loading' });
    void fetchStats(token).then(setView);
  }

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-8 px-4 py-8">
      {view.kind === 'loading' && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <div className="h-7 w-full rounded-[2px] bg-rule" />
          <div className="h-7 w-4/5 rounded-[2px] bg-rule" />
          <div className="mt-6 h-16 w-full rounded-[2px] bg-rule" />
        </div>
      )}

      {view.kind === 'error' && (
        <div className="flex flex-col gap-4">
          <p role="alert">{copy.genericError}</p>
          <button type="button" onClick={retry} className="button button-secondary self-start">
            {copy.retry}
          </button>
        </div>
      )}

      {view.kind === 'ready' && <Scoreboard stats={view.stats} isDemo={view.isDemo} onLogOut={auth.signOut} />}
    </main>
  );
}

function Scoreboard({ stats, isDemo, onLogOut }: { stats: StatsResponse; isDemo: boolean; onLogOut: () => void }) {
  const text = copy.statsScreen;
  const coin = coinParts(stats);
  const figures: [string, string][] = [
    [text.picks, orMissing(stats.avgPicks, percent)],
    [text.all, orMissing(stats.avgAll, percent)],
    [text.passed, orMissing(stats.avgPassed, percent)],
  ];

  return (
    <>
      {isDemo && <p className="border-l-2 border-ink pl-3 text-sm">{text.demoBanner}</p>}

      <Verdict parts={verdictParts(stats)} />

      <dl className="grid grid-cols-3 gap-3">
        {figures.map(([label, value]) => (
          // Values aligned at the bottom, even when a label takes two lines.
          <div key={label} className="flex flex-col justify-between gap-1">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="font-mono text-lg">{value}</dd>
          </div>
        ))}
      </dl>

      {coin && stats.coin && stats.edge !== null && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{text.coinHeading}</h2>
          <CoinRange p5={stats.coin.p5} p95={stats.coin.p95} edge={stats.edge} />
          <p className="text-sm leading-relaxed">
            <Sentence parts={coin} figureClassName="font-mono" />
          </p>
        </section>
      )}

      <dl className="grid grid-cols-2 gap-x-3 gap-y-4 border-t border-rule pt-4">
        <div>
          <dt className="text-xs text-muted">{text.hitRate}</dt>
          <dd className="font-mono">{orMissing(stats.hitRate, share)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{text.played}</dt>
          <dd className="font-mono">{stats.rounds}</dd>
          <dd className="font-mono text-xs text-muted">{text.playedSplit(stats.buys, stats.passes)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{text.currentStreak}</dt>
          <dd className="font-mono">{stats.streak.current}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{text.bestStreak}</dt>
          <dd className="font-mono">{stats.streak.best}</dd>
        </div>
      </dl>

      <p className="text-xs leading-relaxed text-muted">{text.smallPrint}</p>

      <div className="flex items-center gap-4">
        <Link href="/play" className="button button-primary flex-1">
          {text.keepPlaying}
        </Link>
        <button type="button" onClick={onLogOut} className="min-h-12 text-sm underline underline-offset-4">
          {text.logOut}
        </button>
      </div>
    </>
  );
}
