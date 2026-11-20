'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Chart } from '@/components/Chart';
import { DecisionButtons } from '@/components/DecisionButtons';
import { RevealCard } from '@/components/RevealCard';
import { api, ApiError } from '@/lib/api';
import type { DecisionResponse, RoundResponse, Reveal, StatsResponse } from '@/lib/api-types';
import { useAuth } from '@/lib/auth';
import { chartNumberAfter } from '@/lib/chartNumber';
import { copy } from '@/lib/copy';
import { percent } from '@/lib/format';
import { callLine, direction } from '@/lib/reveal';

type Screen =
  | { kind: 'loading' }
  | { kind: 'sealed'; id: string; points: number[]; pending: boolean; failed: boolean }
  | { kind: 'revealed'; id: string; points: number[]; reveal: Reveal }
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
        setScreen({ kind: 'revealed', id: screen.id, points: screen.points, reveal: result.reveal });
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

  // Desktop keys: ← pass, → buy; Enter or Space for the next chart. A focused button handles its own
  // Enter and Space, so the page does not act twice.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (screen.kind === 'sealed' && !screen.pending) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          void decide(event.key === 'ArrowLeft' ? 'pass' : 'buy');
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
  const dir = reveal ? direction(reveal.forwardReturn) : null;
  // The headline and the call, read out once when the reveal arrives (03 §5.3).
  const announcement = reveal
    ? `${dir ? `${dir.label} ` : ''}${percent(reveal.forwardReturn)}. ${callLine(reveal.decision, reveal.forwardReturn)}`
    : '';

  return (
    <main className="mx-auto flex h-svh w-full max-w-[480px] flex-col px-4">
      <header className="grid h-12 shrink-0 grid-cols-3 items-center text-sm">
        <span className="font-mono">{streak !== null && copy.play.streak(streak)}</span>
        <span className="text-center font-mono">{chartNumber !== null && copy.play.roundCount(chartNumber)}</span>
        <Link href="/stats" className="flex min-h-12 items-center justify-self-end underline underline-offset-4">
          {copy.play.statsLink}
        </Link>
      </header>

      <div className="min-h-0 flex-1 py-2" aria-busy={screen.kind === 'loading'}>
        <Chart points={screen.kind === 'sealed' || screen.kind === 'revealed' ? screen.points : []} reveal={reveal} />
      </div>

      {/* Tall enough for the reveal card, so the chart keeps its size at the reveal (03 §10). */}
      <section className="flex min-h-80 shrink-0 flex-col justify-end gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {(screen.kind === 'loading' || screen.kind === 'sealed') && (
          <>
            {screen.kind === 'sealed' && screen.failed && (
              <p role="alert" className="text-sm">
                {copy.play.decisionFailed}
              </p>
            )}
            <p className="text-xl font-semibold">{copy.play.question}</p>
            <p className="hidden font-mono text-xs text-muted pointer-fine:block">{copy.play.keyHints}</p>
            <DecisionButtons disabled={screen.kind !== 'sealed' || screen.pending} onDecide={(d) => void decide(d)} />
          </>
        )}

        {screen.kind === 'revealed' && <RevealCard reveal={screen.reveal} onNext={next} nextRef={nextButton} />}

        {(screen.kind === 'noData' || screen.kind === 'error') && (
          <>
            <p role="alert">{screen.kind === 'noData' ? copy.play.noData : copy.genericError}</p>
            <button type="button" onClick={reload} className="button button-secondary min-h-14">
              {copy.retry}
            </button>
          </>
        )}
      </section>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </main>
  );
}
