'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Chart } from '@/components/Chart';
import { DecisionButtons } from '@/components/DecisionButtons';
import { Logo } from '@/components/Logo';
import { type LiveState, RevealCard } from '@/components/RevealCard';
import { Sentence } from '@/components/Sentence';
import { api, ApiError } from '@/lib/api';
import type { DecisionResponse, LiveResponse, RoundResponse, Reveal, StatsResponse } from '@/lib/api-types';
import { useAuth } from '@/lib/auth';
import { chartNumberAfter } from '@/lib/chartNumber';
import { copy } from '@/lib/copy';
import { callLine, headline } from '@/lib/reveal';

type Screen =
  | { kind: 'loading' }
  | { kind: 'sealed'; id: string; points: number[]; pending: boolean; failed: boolean }
  | { kind: 'revealed'; id: string; points: number[]; reveal: Reveal; live: LiveState; streak: DecisionResponse['streak'] }
  | { kind: 'noData' }
  | { kind: 'error' };

/**
 * The game (03 §5.3): one chart, one question, then the truth. Before the decision this screen asks
 * for the round and for GET /stats, which covers decided rounds only, keeps nothing in storage and
 * writes nothing to the console.
 */
export function PlayScreen() {
  const auth = useAuth();
  const router = useRouter();
  const token = auth.status === 'signedIn' ? auth.token : null;
  const [screen, setScreen] = useState<Screen>({ kind: 'loading' });
  // The top bar: GET /stats gives the first streak and the chart number (03 §5.3); after a decision the
  // streak comes from its response, and the number goes up with the next chart (lib/chartNumber.ts).
  const [streak, setStreak] = useState<number | null>(null);
  const [chartNumber, setChartNumber] = useState<number | null>(null);
  // Decisions sent from this page, so a /stats answer can tell whether one was sent after it was asked.
  const decisionsSent = useRef(0);
  // State reaches the buttons on the next render; the ref stops a second decision in between.
  const deciding = useRef(false);
  const nextButton = useRef<HTMLButtonElement>(null);

  /** The open round, or a new one; the server never gives a different chart while one is open. */
  const fetchRound = useCallback(async (bearer: string): Promise<Screen> => {
    try {
      const { round } = await api<RoundResponse>('/rounds', { method: 'POST', token: bearer });
      return { kind: 'sealed', id: round.id, points: round.points, pending: false, failed: false };
    } catch (err) {
      return { kind: err instanceof ApiError && err.code === 'NO_DATA' ? 'noData' : 'error' };
    }
  }, []);

  /**
   * GET /stats for the top bar. It is optional: if it fails, the labels stay hidden and the game goes on.
   * An answer that comes back after a decision was sent keeps the streak from that decision.
   */
  const askStats = useCallback((bearer: string) => {
    const asked = decisionsSent.current;
    api<StatsResponse>('/stats', { token: bearer }).then(
      (stats) => {
        const decidedSinceAsked = decisionsSent.current !== asked;
        if (!decidedSinceAsked) setStreak(stats.streak.current);
        setChartNumber((n) => chartNumberAfter(n, { kind: 'stats', rounds: stats.rounds, decidedSinceAsked }));
      },
      () => setChartNumber((n) => chartNumberAfter(n, { kind: 'statsFailed' })),
    );
  }, []);

  // No token: plain /login, no notice (03 §7). A rejected token is handled by api.ts.
  useEffect(() => {
    if (auth.status === 'signedOut') router.replace('/login');
  }, [auth.status, router]);

  useEffect(() => {
    if (!token) return;
    let current = true;
    fetchRound(token).then((next) => current && setScreen(next));
    askStats(token);
    return () => {
      current = false;
    };
  }, [token, fetchRound, askStats]);

  /** Loads the chart again; without a chart number yet, asks /stats again too (03 §5.3). */
  const reload = useCallback(() => {
    if (!token) return;
    setScreen({ kind: 'loading' });
    void fetchRound(token).then(setScreen);
    if (chartNumber === null) askStats(token);
  }, [token, fetchRound, chartNumber, askStats]);

  /** The next chart: one more in the count. A retry after an error is `reload` alone. */
  const next = useCallback(() => {
    setChartNumber((n) => chartNumberAfter(n, { kind: 'next' }));
    reload();
  }, [reload]);

  const decide = useCallback(
    async (decision: 'buy' | 'pass') => {
      if (screen.kind !== 'sealed' || !token || deciding.current) return;
      deciding.current = true;
      // Counted when sent, not when answered: a decision whose answer is lost may still be recorded.
      decisionsSent.current += 1;
      setScreen({ ...screen, pending: true, failed: false });
      try {
        const result = await api<DecisionResponse>(`/rounds/${screen.id}/decision`, { method: 'POST', body: { decision }, token });
        setStreak(result.streak.current);
        setScreen({ kind: 'revealed', id: screen.id, points: screen.points, reveal: result.reveal, live: { kind: 'loading' }, streak: result.streak });
      } catch {
        // The round is still open on the server, so trying again is safe (03 §8).
        setScreen({ ...screen, pending: false, failed: true });
      } finally {
        deciding.current = false;
      }
    },
    [screen, token],
  );

  // After the decision, focus moves to the next-chart button (03 §5.3).
  useEffect(() => {
    if (screen.kind === 'revealed') nextButton.current?.focus();
  }, [screen.kind]);

  // (P1) Today's price, asked once per reveal. It is optional: the call does not wait for a sleeping
  // server and never shows the waking screen, and any failure becomes the muted note (03 §8).
  const revealedId = screen.kind === 'revealed' ? screen.id : null;
  useEffect(() => {
    if (!token || !revealedId) return;
    let current = true;
    const show = (live: LiveState) =>
      current && setScreen((now) => (now.kind === 'revealed' && now.id === revealedId ? { ...now, live } : now));
    api<LiveResponse>(`/rounds/${revealedId}/live`, { token, optional: true }).then(
      (response) => show({ kind: 'done', live: response.live }),
      () => show({ kind: 'done', live: { available: false, reason: 'unavailable' } }),
    );
    return () => {
      current = false;
    };
  }, [token, revealedId]);

  // Desktop keys: ← buy, → pass, as the buttons are laid out; Enter or Space for the next chart. A focused button handles its own
  // Enter and Space, so the page does not act twice.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (screen.kind === 'sealed' && !screen.pending) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          void decide(event.key === 'ArrowLeft' ? 'buy' : 'pass');
        }
      } else if (screen.kind === 'revealed' && (event.key === 'Enter' || event.key === ' ')) {
        if ((event.target as HTMLElement).closest('button, a')) return;
        event.preventDefault();
        next();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, decide, next]);

  const reveal = screen.kind === 'revealed' ? screen.reveal : null;
  const head = reveal ? headline(reveal.forwardReturn) : null;
  // The headline and the call, read out once when the reveal arrives (03 §5.3).
  const announcement =
    reveal && head
      ? `${head.label ? `${head.label} ` : ''}${head.value}. ${callLine(reveal.decision, reveal.forwardReturn)} ${reveal.correct ? copy.play.result.right : copy.play.result.wrong}.`
      : '';

  return (
    <main className="mx-auto flex h-svh w-full max-w-[480px] flex-col px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <header className="flex h-11 shrink-0 items-center justify-between gap-2">
        <Logo nameWhenWide />
        <div className="flex items-center gap-2">
          {streak !== null && (
            <p className="flex h-8 items-center rounded-full border border-line bg-surface px-3 text-[13px] whitespace-nowrap text-muted">
              <Sentence parts={copy.play.streak(streak)} figureClassName="tabular font-semibold text-fg" />
            </p>
          )}
          <Link href="/stats" className="flex h-11 items-center rounded-xl border border-line bg-surface px-3 text-[13px] font-medium whitespace-nowrap text-fg">
            {copy.play.statsLink}
          </Link>
        </div>
      </header>

      {/* The chart takes what the block below leaves; at 390 x 844 that is 270 px (the design). */}
      <div className="mt-2 min-h-24 flex-1" aria-busy={screen.kind === 'loading'}>
        <Chart points={screen.kind === 'sealed' || screen.kind === 'revealed' ? screen.points : []} reveal={reveal} />
      </div>

      {/* One fixed height for the question, the reveal, the loading and the error states, so the chart keeps its size at the reveal (03 §10). The reveal's content needs about 445 px; 464 px is the design's. On a short phone both blocks tighten to 360 px (RevealCard drops its streak card) and the chart keeps about 190 px. */}
      <section className="h-[clamp(448px,55svh,464px)] shrink-0 short:h-[360px]">
        {(screen.kind === 'loading' || screen.kind === 'sealed') && (
          <div className="flex h-full flex-col pt-3.5">
            <ul className="flex flex-wrap gap-2">
              {/* The chart number leads the chips: the top bar of the design has no room for a second pill. Hidden while unknown (lib/chartNumber.ts). */}
              {chartNumber !== null && (
                <li className="tabular flex h-7 items-center rounded-full border border-line-strong px-2.5 text-xs font-medium text-fg">{copy.play.roundCount(chartNumber)}</li>
              )}
              {copy.play.chips.map((chip) => (
                <li key={chip} className="flex h-7 items-center rounded-full border border-line-strong px-2.5 text-xs text-muted">
                  {chip}
                </li>
              ))}
            </ul>
            <h1 className="mt-[22px] font-display text-[34px] leading-[38px] font-bold tracking-[-0.02em] short:mt-4 short:text-[30px] short:leading-[34px]">{copy.play.question}</h1>
            <p className="mt-2.5 text-[15px] leading-[22px] text-pretty text-muted">{copy.play.questionHint}</p>
            <div className="mt-auto">
              {screen.kind === 'sealed' && screen.failed && (
                <p role="alert" className="mb-3 text-sm">
                  {copy.play.decisionFailed}
                </p>
              )}
              <DecisionButtons disabled={screen.kind !== 'sealed' || screen.pending} onDecide={(d) => void decide(d)} />
              <p className="mt-3 text-center text-xs leading-[18px] text-faint">{copy.play.onceNote}</p>
              <p className="hidden text-center text-xs leading-[18px] text-faint pointer-fine:block">{copy.play.keys}</p>
            </div>
          </div>
        )}

        {screen.kind === 'revealed' && (
          <RevealCard reveal={screen.reveal} live={screen.live} streak={screen.streak} onNext={next} nextRef={nextButton} />
        )}

        {(screen.kind === 'noData' || screen.kind === 'error') && (
          <div className="flex h-full flex-col justify-end gap-3">
            <p role="alert">{screen.kind === 'noData' ? copy.play.noData : copy.genericError}</p>
            <button type="button" onClick={reload} className="button button-secondary">
              {copy.retry}
            </button>
          </div>
        )}
      </section>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </main>
  );
}
