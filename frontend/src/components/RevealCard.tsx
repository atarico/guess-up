import Link from 'next/link';
import type { CSSProperties, Ref } from 'react';
import type { LiveQuote, Reveal } from '@/lib/api-types';
import { copy } from '@/lib/copy';
import { money } from '@/lib/format';
import { callLine, headline, liveLine } from '@/lib/reveal';

/** (P1) Today's price arrives after the reveal and may never arrive; the card is complete without it. */
export type LiveState = { kind: 'loading' } | { kind: 'done'; live: LiveQuote };

type Props = {
  reveal: Reveal;
  live: LiveState;
  /** From the decision's response. */
  streak: { current: number; best: number };
  /** The tenth chart, with a verdict against the coin waiting on Stats (lib/progress.ts). */
  verdictReady: boolean;
  onNext: () => void;
  nextRef: Ref<HTMLButtonElement>;
};

/** When a block rises after the chart has drawn (Chart.css): the later, the further down the screen. */
const riseAt = (ms: number) => ({ '--rise-delay': `${ms}ms` }) as CSSProperties;

/** The reveal block, in the order of 03 §5.3. Its height is set by the screen, so the chart keeps its size (03 §10). */
export function RevealCard({ reveal, live, streak, verdictReady, onNext, nextRef }: Props) {
  const r = reveal.forwardReturn;
  const head = headline(r);
  const cutoffClose = reveal.history[reveal.history.length - 1].c;
  const endClose = reveal.future[reveal.future.length - 1].c;
  const sector = reveal.sector ? (copy.sectors[reveal.sector] ?? reveal.sector) : null;
  const meta = sector && reveal.exchange ? copy.play.meta(sector, reveal.exchange) : (sector ?? reveal.exchange);

  return (
    <div className="flex h-full flex-col gap-2.5 pt-2.5 short:gap-1.5 short:pt-1.5">
      {/* Number, arrow, colour and label all come from headline(): shown as 0.0%, no arrow and fg (03 §5.3). */}
      <p className="reveal-rise flex items-baseline gap-2.5">
        <span className={`tabular font-display text-[50px] leading-[56px] font-bold tracking-[-0.02em] short:text-[40px] short:leading-[46px] ${head.colour}`}>
          {head.arrow && (
            <span role="img" aria-label={head.label ?? undefined}>
              {head.arrow}
            </span>
          )}
          {head.arrow && ' '}
          {head.value}
        </span>
        <span className="text-[13px] text-muted">{copy.play.inThreeMonths}</span>
      </p>

      <div className="reveal-rise flex h-8 items-center justify-between gap-3" style={riseAt(1150)}>
        <p className="font-display text-xl leading-[26px] font-semibold">{callLine(reveal.decision, r)}</p>
        <p className="flex h-[30px] shrink-0 items-center gap-1.5 rounded-full border border-line-strong pr-3 pl-2.5 text-[13px] font-medium">
          <ResultIcon correct={reveal.correct} />
          {reveal.correct ? copy.play.result.right : copy.play.result.wrong}
        </p>
      </div>

      <div className="card reveal-rise flex h-16 items-center gap-3 px-3.5" style={riseAt(1230)}>
        <div className="flex h-10 w-[52px] shrink-0 items-center justify-center rounded-[10px] bg-well font-display text-[13px] font-bold tracking-[0.04em]">
          {reveal.symbol}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-[15px] leading-5 font-semibold">{reveal.name}</p>
          {meta && <p className="truncate text-[13px] leading-[18px] text-muted">{meta}</p>}
        </div>
      </div>

      <div className="reveal-rise flex flex-col gap-1.5" style={riseAt(1310)}>
        <div className="card flex flex-col">
          <div className={`flex min-h-12 items-center justify-between gap-3 border-b border-line px-3.5 py-1.5 ${verdictReady ? 'short:border-b-0' : ''}`}>
            <span className="text-[13px] text-muted">{copy.play.pricesRow}</span>
            <span className="tabular text-right text-[15px] font-semibold">{copy.play.prices(money(cutoffClose), money(endClose))}</span>
          </div>
          {/* On a short phone the tenth chart's notice needs this room (measured: 24 px over); today's price is optional. */}
          <div className={`flex min-h-[58px] items-center justify-between gap-3 px-3.5 py-1.5 ${verdictReady ? 'short:hidden' : ''}`}>
            <span className="text-[13px] text-muted">{copy.play.todayRow}</span>
            <LiveView live={live} />
          </div>
        </div>
        <p className="text-xs text-muted">{copy.play.priceNote}</p>
      </div>

      {verdictReady ? (
        // Takes the streak card's place, on short phones too: the top bar's pill shows the streak (03 §5.3).
        <Link
          href="/stats"
          className="reveal-rise flex min-h-11 items-center rounded-2xl border border-dashed border-gold px-3.5 text-[13px] leading-[18px] font-medium text-gold underline underline-offset-4"
          style={riseAt(1390)}
        >
          {copy.play.verdictReady}
        </Link>
      ) : (
        // Left out on a short phone: the top bar's Racha pill already shows the current streak.
        <div className="card reveal-rise flex h-11 items-center justify-between gap-3 px-3.5 text-[13px] text-muted short:hidden" style={riseAt(1390)}>
          <p>
            {copy.play.currentStreak} <span className="tabular text-[15px] font-semibold text-fg">{streak.current}</span>
          </p>
          <p>
            {copy.play.bestStreak} <span className="tabular text-[15px] font-semibold text-fg">{streak.best}</span>
          </p>
        </div>
      )}

      <button ref={nextRef} type="button" onClick={onNext} className="button button-primary reveal-rise mt-auto" style={riseAt(1470)}>
        {copy.play.next}
      </button>
    </div>
  );
}

/** A check when the call was right, a cross when it was not: the word beside it says the same (not colour alone). */
function ResultIcon({ correct }: { correct: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={correct ? 'M3 8.5 L6.5 12 L13 4.5' : 'M4 4 L12 12 M12 4 L4 12'}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={correct ? 'stroke-accent' : 'stroke-muted'}
      />
    </svg>
  );
}

/**
 * (P1) Today's price (03 §5.3), in the right half of its row: a skeleton while it loads, then the
 * price with the move since the cutoff, or the muted note. The arrow, sign and colour come from
 * `liveLine`, which reads them from `headline`, so this never contradicts its own number.
 */
function LiveView({ live }: { live: LiveState }) {
  if (live.kind === 'loading') {
    return (
      <div role="status" aria-busy="true" className="flex flex-col items-end gap-2">
        <span className="sr-only">{copy.play.todayLoading}</span>
        <span aria-hidden="true" className="h-3.5 w-[92px] rounded-full bg-well" />
        <span aria-hidden="true" className="h-2.5 w-[150px] rounded-full bg-raised" />
      </div>
    );
  }
  const quote = live.live;
  const line = liveLine(quote);
  if (line.kind === 'note') return <p className="text-right text-xs text-muted">{line.text}</p>;
  // liveLine gives a price line only for an available quote; this narrows the type for the price.
  if (!quote.available) return null;
  return (
    <div className="flex flex-col items-end gap-0.5">
      <p className="tabular text-[15px] leading-5 font-semibold">{money(quote.price)}</p>
      <p className={`tabular text-xs leading-[18px] ${line.head.colour}`}>
        {line.head.arrow && (
          <span role="img" aria-label={line.head.label ?? undefined}>
            {line.head.arrow}
          </span>
        )}
        {line.head.arrow && ' '}
        {line.head.value} {line.since}
      </p>
    </div>
  );
}
