import { copy } from '@/lib/copy';
import { signedPoints } from '@/lib/format';

type Props = { p5: number; p95: number; edge: number };

/** Keeps a label that is centred on a point from running off either side. */
const clamp = (x: number) => Math.min(94, Math.max(6, x));

/**
 * The coin's band (03 §5.4): from the 5th to the 95th percentile, a tick at 0 and a marker for the
 * user's edge. The scale always includes p5, p95, 0 and the edge, plus a margin, so the marker is
 * inside the drawing even when it falls outside the band. The band's ends are labelled below and
 * grow away from each other; the user's value sits above its marker.
 */
export function CoinRange({ p5, p95, edge }: Props) {
  const low = Math.min(p5, edge, 0);
  const high = Math.max(p95, edge, 0);
  const margin = (high - low) * 0.15 || 0.01;
  /** A value in decimals to a position in percent of the width. */
  const x = (v: number) => ((v - (low - margin)) / (high - low + 2 * margin)) * 100;

  return (
    <div
      role="img"
      aria-label={copy.statsScreen.coinBandLabel(signedPoints(p5), signedPoints(p95), signedPoints(edge))}
      className="relative h-16 font-mono text-xs"
    >
      <span className="absolute top-0 -translate-x-1/2 font-bold" style={{ left: `${clamp(x(edge))}%` }}>
        {signedPoints(edge)}
      </span>
      <div className="absolute inset-x-0 top-8 h-px bg-rule" />
      <div className="absolute top-6 h-4 rounded-[2px] bg-rule" style={{ left: `${x(p5)}%`, width: `${x(p95) - x(p5)}%` }} />
      <div className="absolute top-5 h-6 w-px bg-muted" style={{ left: `${x(0)}%` }} />
      <div className="absolute top-[1.625rem] size-3 -translate-x-1/2 rounded-full bg-ink" style={{ left: `${x(edge)}%` }} />
      <span className="absolute top-11 -translate-x-full pr-1 text-muted" style={{ left: `${x(p5)}%` }}>
        {signedPoints(p5)}
      </span>
      <span className="absolute top-11 pl-1 text-muted" style={{ left: `${x(p95)}%` }}>
        {signedPoints(p95)}
      </span>
    </div>
  );
}
