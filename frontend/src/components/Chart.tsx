'use client';

import { type CSSProperties, type RefObject, useEffect, useRef, useState } from 'react';
import type { Reveal } from '@/lib/api-types';
import { copy } from '@/lib/copy';
import { dateFull } from '@/lib/format';
import './Chart.css';

// 03 §6. Hand-written SVG: no axes, no values, no dates and no read-out on hover or touch before the
// decision; there are no pointer handlers and no <title>, which a browser would show as a tooltip.

/** Pixels above and below the line, so it never touches the edge and the tip dot's halo fits. */
const TOP = 20;
const BOTTOM = 24;
/** Pixels kept on the right for the tip dot and its halo. */
const RIGHT = 12;
/** Four hairlines for shape reference, as fractions of the height; they carry no labels. */
const HAIRLINES = [0.23, 0.46, 0.69, 0.92];
/** Height of the row of dates under the plot, reserved in both states so the chart does not move at the reveal. */
const DATE_ROW = 18;

type Props = {
  /** The sealed points, 252 numbers in [0, 1]. Empty while a round loads: only the frame is drawn. */
  points: number[];
  /** Present once the user has decided. */
  reveal?: Reveal | null;
};

/**
 * The size of the element in CSS pixels. The SVG is drawn in those pixels, so the line, the dots and
 * the labels stay sharp at any width from 320 to 480 px, with no stretching.
 */
function useBoxSize(ref: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

const toPoints = (xy: [number, number][]) => xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
/** A closed shape under a line, down to `floor`, for the gradient fill. */
const toArea = (xy: [number, number][], floor: number) => {
  const lines = xy.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return `M${xy[0][0].toFixed(1)},${floor} ${lines} L${xy[xy.length - 1][0].toFixed(1)},${floor} Z`;
};

export function Chart({ points, reveal }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const { width, height } = useBoxSize(box);
  const ready = width > 0 && height > 0;

  const plotWidth = Math.max(0, width - RIGHT);
  const bottom = Math.max(TOP, height - BOTTOM);

  // Where the cutoff falls once the future is added: the shown year is bar 0 to bar nh - 1 of nh + nf - 1.
  const cutX = reveal ? (plotWidth * (reveal.history.length - 1)) / (reveal.history.length + reveal.future.length - 1) : 0;
  const cutRight = width - cutX + 6;

  return (
    <div className="flex h-full flex-col">
      <div ref={box} className="relative min-h-0 flex-1">
        {ready && (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={reveal ? copy.chart.revealed(reveal.name) : copy.chart.sealed}
            className="block"
          >
            {HAIRLINES.map((f) => (
              <line key={f} x1={0} x2={width} y1={height * f} y2={height * f} className="stroke-grid" strokeWidth={1} />
            ))}
            {reveal ? (
              <Revealed reveal={reveal} height={height} plotWidth={plotWidth} bottom={bottom} cutX={cutX} />
            ) : (
              <Sealed points={points} height={height} plotWidth={plotWidth} bottom={bottom} />
            )}
          </svg>
        )}
        {ready && reveal && (
          <span className="chart-labels absolute top-0 text-[11px] leading-[14px] text-muted" style={{ right: cutRight }}>
            {copy.play.cutLabel}
          </span>
        )}
      </div>

      <div className="relative mt-1 shrink-0 text-[11px] leading-[18px] text-faint tabular" style={{ height: DATE_ROW }}>
        {ready && reveal && (
          <div className="chart-labels">
            <span className="absolute top-0 left-0">{dateFull(reveal.startDate)}</span>
            <span className="absolute top-0" style={{ right: cutRight }}>
              {dateFull(reveal.cutoffDate)}
            </span>
            <span className="absolute top-0 right-0">{dateFull(reveal.endDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

type SealedProps = { points: number[]; height: number; plotWidth: number; bottom: number };

/** The year as the user sees it before deciding: the accent line over the whole width, nothing else. */
function Sealed({ points, height, plotWidth, bottom }: SealedProps) {
  if (points.length === 0) return null;
  const xy = points.map((p, i): [number, number] => [(i / (points.length - 1)) * plotWidth, bottom - p * (bottom - TOP)]);
  const tip = xy[xy.length - 1];
  return (
    <>
      <defs>
        <linearGradient id="chart-fill-sealed" gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={TOP} y2={height}>
          <stop offset="0" stopColor="var(--color-accent)" stopOpacity={0.3} />
          <stop offset="0.94" stopColor="var(--color-accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={toArea(xy, height)} fill="url(#chart-fill-sealed)" />
      <polyline points={toPoints(xy)} className="chart-line stroke-accent" />
      <circle cx={tip[0]} cy={tip[1]} r={10} className="fill-accent" opacity={0.18} />
      <circle cx={tip[0]} cy={tip[1]} r={4.5} className="fill-accent" />
    </>
  );
}

type RevealedProps = { reveal: Reveal; height: number; plotWidth: number; bottom: number; cutX: number };

/**
 * The revealed state (03 §6). Everything is drawn once, in its final place: one x scale over history
 * and future, one y scale over both. The sealed year was drawn with a wider x scale and a tighter y
 * scale. Both are affine, so the history only has to go from the sealed placement to its final one:
 * a CSS transform (scale and translate) animates that move, and the path data is never animated.
 */
function Revealed({ reveal, height, plotWidth, bottom, cutX }: RevealedProps) {
  const { history, future } = reveal;
  const nh = history.length;
  /** The last bar's index, over history and future together: the x scale is index / last. */
  const last = nh + future.length - 1;

  const historyCloses = history.map((bar) => bar.c);
  const allCloses = [...historyCloses, ...future.map((bar) => bar.c)];
  const lo = Math.min(...allCloses);
  const hi = Math.max(...allCloses);
  /** A close as a fraction of the revealed price range, 0 at the bottom. */
  const unit = (c: number) => (hi === lo ? 0.5 : (c - lo) / (hi - lo));
  const yOf = (c: number) => bottom - unit(c) * (bottom - TOP);

  const historyXY = history.map((bar, i): [number, number] => [(i / last) * plotWidth, yOf(bar.c)]);
  const cutoff = history[nh - 1];
  const end = future[future.length - 1];
  const futureXY: [number, number][] = [
    [cutX, yOf(cutoff.c)],
    ...future.map((bar, j): [number, number] => [((nh + j) / last) * plotWidth, yOf(bar.c)]),
  ];
  const tip = futureXY[futureXY.length - 1];
  // The future line, area and tip take one colour, by the final close against the cutoff close.
  const up = end.c > cutoff.c;
  const colour = up ? 'var(--color-up)' : 'var(--color-down)';

  // From the sealed placement to the final one: y' = s * y + t on the y axis, and x stretched by sx.
  // The sealed year spanned [lo1, hi1] over the whole plot height and the whole width.
  const lo1 = Math.min(...historyCloses);
  const hi1 = Math.max(...historyCloses);
  const sx = last / (nh - 1);
  let sy = 1;
  let ty = 0;
  if (hi1 === lo1) {
    // A flat year is drawn in the middle when sealed; only a shift is needed.
    ty = bottom - 0.5 * (bottom - TOP) - yOf(hi1);
  } else {
    const span = unit(hi1) - unit(lo1);
    sy = 1 / span;
    ty = bottom * (1 - sy) + unit(lo1) * (bottom - TOP) * sy;
  }
  const from = `translate(0px, ${ty.toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  // The history area goes down far enough that, scaled back to the sealed placement, it still reaches the bottom.
  const historyFloor = Math.max(height, (height - ty) / sy);

  return (
    <>
      <defs>
        <linearGradient id="chart-fill-history" gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={TOP} y2={height}>
          <stop offset="0" stopColor="var(--color-accent)" stopOpacity={0.3} />
          <stop offset="0.94" stopColor="var(--color-accent)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="chart-fill-future" gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={TOP} y2={height}>
          <stop offset="0" stopColor={colour} stopOpacity={0.32} />
          <stop offset="0.94" stopColor={colour} stopOpacity={0} />
        </linearGradient>
      </defs>

      <g className="chart-history" style={{ '--chart-from': from } as CSSProperties}>
        <path d={toArea(historyXY, historyFloor)} fill="url(#chart-fill-history)" className="chart-history-area" />
        <polyline points={toPoints(historyXY)} className="chart-line chart-history-line" />
      </g>

      <path d={toArea(futureXY, height)} fill="url(#chart-fill-future)" className="chart-future-area" />
      <polyline points={toPoints(futureXY)} pathLength={1} className={`chart-line chart-future ${up ? 'stroke-up' : 'stroke-down'}`} />

      <g className="chart-labels">
        <line x1={cutX} x2={cutX} y1={16} y2={height - 6} className="stroke-cut" strokeWidth={1} strokeDasharray="3 4" />
        <circle cx={tip[0]} cy={tip[1]} r={10} className={up ? 'fill-up' : 'fill-down'} opacity={0.18} />
        <circle cx={tip[0]} cy={tip[1]} r={4.5} className={up ? 'fill-up' : 'fill-down'} />
      </g>
    </>
  );
}
