'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CoinHistogram } from '@/components/CoinHistogram';
import { Logo } from '@/components/Logo';
import { RecentRounds } from '@/components/RecentRounds';
import { Sentence } from '@/components/Sentence';
import { Verdict } from '@/components/Verdict';
import { api } from '@/lib/api';
import type { MeResponse, RecentRound, RecentRoundsResponse, StatsResponse } from '@/lib/api-types';
import { useAuth } from '@/lib/auth';
import { copy } from '@/lib/copy';
import { count, percent, share } from '@/lib/format';
import { arrowLabel, averageBars, edgeView, ringOffset, type Direction } from '@/lib/statsView';
import { coinCardParts, verdictParts } from '@/lib/verdict';
import './stats.css';

/** `recent` is null when its call failed: that card is left out and the scoreboard still shows. */
type View = { kind: 'loading' } | { kind: 'ready'; stats: StatsResponse; isDemo: boolean; recent: RecentRound[] | null } | { kind: 'error' };

/** The scoreboard (03 §5.4), top to bottom, and below it the (P1) list of the last rounds. */
export function StatsScreen() {
  const auth = useAuth();
  const router = useRouter();
  const token = auth.status === 'signedIn' ? auth.token : null;
  const [view, setView] = useState<View>({ kind: 'loading' });

  /**
   * The figures, and whether this is the demo account: the client keeps only the token (03 §7), so
   * GET /auth/me says it. All are awaited, so the banner never appears after the verdict; if
   * /auth/me fails, there is simply no banner, and if the list fails, no list card: only /stats is
   * essential.
   */
  const fetchStats = useCallback(
    (bearer: string): Promise<View> =>
      Promise.all([
        api<StatsResponse>('/stats', { token: bearer }),
        api<MeResponse>('/auth/me', { token: bearer }).then(
          ({ user }) => user.isDemo,
          () => false,
        ),
        api<RecentRoundsResponse>('/rounds?limit=20', { token: bearer }).then(
          ({ rounds }) => rounds,
          () => null,
        ),
      ]).then(
        ([stats, isDemo, recent]): View => ({ kind: 'ready', stats, isDemo, recent }),
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
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      <header className="flex h-11 shrink-0 items-center justify-between">
        <Logo />
        <h1 className="text-[13px] font-normal text-muted">{copy.play.statsLink}</h1>
      </header>

      {view.kind === 'loading' && (
        <div aria-busy="true" className="flex flex-col gap-4">
          <div className="h-3 w-2/3 rounded-full bg-well" />
          <div className="h-[90px] w-full rounded-2xl bg-well" />
          <div className="h-16 w-full rounded-2xl bg-surface" />
          <div className="h-52 w-full rounded-2xl bg-surface" />
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

      {view.kind === 'ready' && <Scoreboard stats={view.stats} isDemo={view.isDemo} recent={view.recent} onLogOut={auth.signOut} />}
    </main>
  );
}

const TEXT: Record<Direction, string> = { up: 'text-up', down: 'text-down', flat: 'text-fg' };
const RING_RADIUS = 34;
const RING_FULL = 2 * Math.PI * RING_RADIUS;

function Scoreboard({ stats, isDemo, recent, onLogOut }: { stats: StatsResponse; isDemo: boolean; recent: RecentRound[] | null; onLogOut: () => void }) {
  const text = copy.statsScreen;
  const against = stats.verdict === 'coin' || stats.verdict === 'better' || stats.verdict === 'worse';

  return (
    <>
      {isDemo && (
        <p className="rounded-xl border border-dashed border-gold px-3.5 py-2.5 text-[13px] leading-[18px] text-gold">{text.demoBanner}</p>
      )}

      <div className="flex flex-col gap-3 pt-1">
        <p className="text-xs leading-4 tracking-[0.06em] text-muted uppercase">{copy.statsCards.decided(stats.rounds)}</p>
        <Verdict parts={verdictParts(stats)} />
      </div>

      {against && (
        <div className="card flex items-center gap-3 px-4 py-3.5">
          <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
            <circle cx="18" cy="18" r="15" strokeWidth="2" className="fill-gold/10 stroke-gold" />
            <circle cx="18" cy="18" r="9" fill="none" strokeWidth="1.5" strokeDasharray="2 3" className="stroke-gold" />
          </svg>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] leading-[22px] font-semibold">{copy.statsCards.verdictLine[stats.verdict as 'coin' | 'better' | 'worse']}</span>
            <span className="text-[13px] leading-[18px] text-muted">{text.playedSplit(stats.buys, stats.passes)}</span>
          </div>
        </div>
      )}

      {/* The way back to the game, also here, so it is one tap away after the verdict without scrolling (03 §5.4). */}
      <Link href="/play" className="button button-primary">
        {text.keepPlaying}
      </Link>

      <AveragesCard stats={stats} />
      <CoinCard stats={stats} />
      <HitsCard stats={stats} />
      {recent && recent.length > 0 && <RecentRounds rounds={recent} />}

      <p className="text-xs leading-[18px] text-pretty text-faint">{text.smallPrint}</p>

      <Link href="/play" className="button button-primary mt-2">
        {text.keepPlaying}
      </Link>
      <button type="button" onClick={onLogOut} className="min-h-11 self-center px-3 text-sm text-muted underline underline-offset-4">
        {text.logOut}
      </button>
    </>
  );
}

/** The three averages as bars, then the edge: picks minus buying all (03 §5.4). A missing figure is a dash and an empty bar. */
function AveragesCard({ stats }: { stats: StatsResponse }) {
  const text = copy.statsCards.averages;
  const rows = [
    { label: text.picks, n: stats.buys, value: stats.avgPicks, bar: 'bg-accent' },
    { label: text.all, n: stats.rounds, value: stats.avgAll, bar: 'bg-fg' },
    { label: text.passed, n: stats.passes, value: stats.avgPassed, bar: 'bg-passed' },
  ];
  const widths = averageBars(rows.map((row) => row.value));
  const edge = edgeView(stats.edge);

  return (
    <section className="card flex flex-col gap-4 p-4">
      <h2 className="font-display text-base leading-5 font-semibold">{text.heading}</h2>
      {rows.map((row, i) => (
        <div key={row.label} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-[13px] leading-5">
            <span className="text-muted">
              {row.label} <span className="text-faint">· {row.n}</span>
            </span>
            <span className="text-[15px] font-semibold tabular">{row.value === null ? copy.statsScreen.missing : percent(row.value)}</span>
          </div>
          <div className="h-2.5 rounded-[5px] bg-well">
            {/* The sign is in the number beside the bar; the bar only shows size. */}
            <div className={`stats-average h-2.5 rounded-[5px] ${row.bar}`} style={{ width: `${widths[i]}%`, animationDelay: `${100 + i * 120}ms` }} />
          </div>
        </div>
      ))}
      {/* With "puntos" the value is wider than the design's "pp": it drops below the label when the row is too narrow. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-4">
        <div className="flex min-w-40 flex-1 flex-col gap-0.5">
          <span className="text-[15px] leading-5 font-semibold">{text.edge}</span>
          <span className="text-xs leading-4 text-muted">{text.edgeHint}</span>
        </div>
        <span className={`ml-auto font-display text-xl leading-7 font-bold whitespace-nowrap tabular ${TEXT[edge.direction]}`}>
          {edge.arrow && (
            <span role="img" aria-label={arrowLabel(edge.direction) ?? undefined}>
              {edge.arrow}{' '}
            </span>
          )}
          {edge.text}
        </span>
      </div>
    </section>
  );
}

/** You against 2,000 coins; left out when the guard in lib/verdict.ts says a number is missing. */
function CoinCard({ stats }: { stats: StatsResponse }) {
  const sentence = coinCardParts(stats);
  // `coinCardParts` is non-null only with a coin and an edge; this narrows them for the compiler.
  if (!sentence || !stats.coin || stats.edge === null) return null;
  const text = copy.statsCards.coin;

  return (
    <section className="card flex flex-col gap-3.5 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-base leading-5 font-semibold">{text.heading}</h2>
        <p className="text-[13px] leading-[18px] text-muted">{text.intro(count(stats.coin.trials), String(stats.buys), String(stats.rounds))}</p>
      </div>
      <CoinHistogram histogram={stats.coin.histogram} p5={stats.coin.p5} p95={stats.coin.p95} edge={stats.edge} trials={stats.coin.trials} />
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs leading-4 text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[2px] bg-gold" />
          {text.legendRange}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[2px] bg-accent" />
          {text.legendYou}
        </span>
      </div>
      <p className="text-xs leading-[18px] text-pretty text-muted">{text.twoHumps}</p>
      <p className="border-t border-line pt-3.5 text-sm leading-[21px] text-pretty">
        <Sentence parts={sentence} figureClassName="font-semibold tabular" />
      </p>
    </section>
  );
}

/** The hit rate as a ring, the count, and the streaks. Without a rate (no rounds), the ring is empty. */
function HitsCard({ stats }: { stats: StatsResponse }) {
  const text = copy.statsCards.hits;
  const rate = stats.hitRate;

  return (
    <section className="card flex flex-col gap-4 p-4">
      <h2 className="font-display text-base leading-5 font-semibold">{text.heading}</h2>
      <div className="flex items-center gap-5">
        <div className="relative size-[88px] shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true" className="absolute inset-0 -rotate-90">
            <circle cx="44" cy="44" r={RING_RADIUS} fill="none" strokeWidth="8" className="stroke-line" />
            <circle
              cx="44"
              cy="44"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className="stats-ring stroke-accent"
              style={{ strokeDasharray: RING_FULL, strokeDashoffset: ringOffset(rate, RING_FULL), '--ring-full': RING_FULL } as React.CSSProperties}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold tabular">
            {rate === null ? copy.statsScreen.missing : share(rate)}
          </div>
        </div>
        <div className="flex grow flex-col gap-2.5">
          <div className="flex flex-col gap-0.5">
            {rate !== null && <span className="text-[15px] leading-5 font-semibold">{text.count(Math.round(rate * stats.rounds), stats.rounds)}</span>}
            <span className="text-xs leading-4 text-muted">{text.hint}</span>
          </div>
          <div className="flex gap-5 text-[13px] leading-5 text-muted">
            <span>
              {text.current} <span className="text-[15px] font-semibold text-fg tabular">{stats.streak.current}</span>
            </span>
            <span>
              {text.best} <span className="text-[15px] font-semibold text-fg tabular">{stats.streak.best}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
