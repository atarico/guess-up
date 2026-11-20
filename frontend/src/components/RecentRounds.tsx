import type { RecentRound } from '@/lib/api-types';
import { copy } from '@/lib/copy';
import { monthYear, percent } from '@/lib/format';
import { ARROWS, arrowLabel, directionOf, STRIP_HEIGHT, stripBars, type Direction } from '@/lib/statsView';

// Whole class names, so Tailwind finds them. Flat (shows as 0.0%) is neutral, never up or down.
const TEXT: Record<Direction, string> = { up: 'text-up', down: 'text-down', flat: 'text-fg' };
const FILL: Record<Direction, string> = { up: 'bg-up', down: 'bg-down', flat: 'bg-fg' };
const OUTLINE: Record<Direction, string> = { up: 'border-up', down: 'border-down', flat: 'border-fg' };
const ORIGIN: Record<Direction, string> = { up: 'bottom', down: 'top', flat: 'center' };

/** The check and the cross of the design, 16 px. */
const TICK = 'M3 8.5 L6.5 12 L13 4.5';
const CROSS = 'M4 4 L12 12 M12 4 L4 12';

/**
 * The last rounds (P1, 03 §5.4): a strip of bars, then one row each. `rounds` arrives newest first;
 * the strip reads oldest to newest, left to right, the rows newest first.
 */
export function RecentRounds({ rounds }: { rounds: RecentRound[] }) {
  const text = copy.statsCards.recent;
  const oldestFirst = [...rounds].reverse();
  const bars = stripBars(oldestFirst.map((r) => r.forwardReturn));

  return (
    <section className="card flex flex-col gap-3.5 px-4 pt-4 pb-2">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-base font-semibold">{text.heading(rounds.length)}</h2>
        <p className="text-xs leading-[18px] text-muted">{text.legend}</p>
      </div>

      <div role="img" aria-label={text.stripLabel} className="relative flex gap-1" style={{ height: STRIP_HEIGHT }}>
        <div className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
        {oldestFirst.map((round, i) => {
          const bar = bars[i];
          return (
            <div key={round.id} className="relative h-full min-w-0 flex-1">
              <div
                // Filled when bought, outlined when passed; the colour is the sign of the shown return.
                className={`stats-strip-bar absolute inset-x-0 box-border rounded-[3px] border-[1.5px] ${OUTLINE[bar.direction]} ${round.decision === 'buy' ? FILL[bar.direction] : ''}`}
                style={{ top: bar.top, height: bar.height, transformOrigin: ORIGIN[bar.direction], animationDelay: `${500 + i * 30}ms` }}
              />
            </div>
          );
        })}
      </div>

      <ul>
        {rounds.map((round) => {
          const shown = percent(round.forwardReturn);
          const direction = directionOf(shown);
          const arrow = ARROWS[direction];
          return (
            <li
              key={round.id}
              className="grid h-10 grid-cols-[56px_64px_minmax(0,1fr)_84px_18px] items-center gap-2 border-t border-line text-[13px]"
            >
              <span className="font-display font-semibold tracking-[0.03em]">{round.symbol}</span>
              <span className="text-xs text-faint tabular">{monthYear(round.cutoffDate)}</span>
              <span className="truncate text-muted">{round.decision === 'buy' ? text.bought : text.passed}</span>
              <span className={`text-right font-semibold whitespace-nowrap tabular ${TEXT[direction]}`}>
                {arrow && (
                  <span role="img" aria-label={arrowLabel(direction) ?? undefined}>
                    {arrow}{' '}
                  </span>
                )}
                {shown}
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" role="img" aria-label={round.correct ? text.right : text.wrong} className="justify-self-end">
                <path
                  d={round.correct ? TICK : CROSS}
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={round.correct ? 'stroke-accent' : 'stroke-faint'}
                />
              </svg>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
