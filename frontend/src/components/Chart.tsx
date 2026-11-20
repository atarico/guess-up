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
/**
 * The year takes the left 80% of the plot in both states; the right 20% is the question when sealed
 * and the three months when revealed. So nothing moves sideways at the reveal (03 §6).
 */
const HISTORY_SHARE = 0.8;
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

  // The cutoff: the end of the year and the edge of the question zone, at the same x in both states.
  const cutX = plotWidth * HISTORY_SHARE;
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
              <Sealed points={points} width={width} height={height} cutX={cutX} bottom={bottom} />
            )}
          </svg>
        )}
        {/* The question zone as a box, for the guided tour to point at (lib/tour.ts); it draws nothing. */}
        {ready && !reveal && points.length > 0 && (
          <div data-tour="zone" aria-hidden="true" className="pointer-events-none absolute top-0 bottom-0" style={{ left: cutX, width: width - cutX }} />
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

type SealedProps = { points: number[]; width: number; height: number; cutX: number; bottom: number };

/**
 * The year as the user sees it before deciding: the accent line over the left 80%, then an empty
 * zone with a dashed edge and a gold `?`. The empty space is the question. The edge is drawn where the
 * cutoff line will be, so at the reveal it simply stays.
 */
function Sealed({ points, width, height, cutX, bottom }: SealedProps) {
  if (points.length === 0) return null;
  const xy = points.map((p, i): [number, number] => [(i / (points.length - 1)) * cutX, bottom - p * (bottom - TOP)]);
  const tip = xy[xy.length - 1];
  const zoneMiddle = (cutX + width) / 2;
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
      <CutLine cutX={cutX} height={height} />
      <circle cx={zoneMiddle} cy={height / 2} r={17} className="chart-question-ring" />
      <text x={zoneMiddle} y={height / 2} textAnchor="middle" dominantBaseline="central" className="chart-question-mark">
        {copy.chart.unknown}
      </text>
    </>
  );
}

/** The dashed edge of the question zone, which is the cutoff line once revealed. */
function CutLine({ cutX, height }: { cutX: number; height: number }) {
  return <line x1={cutX} x2={cutX} y1={16} y2={height - 6} className="stroke-cut" strokeWidth={1} strokeDasharray="3 4" />;
}

type RevealedProps = { reveal: Reveal; height: number; plotWidth: number; bottom: number; cutX: number };

/**
 * The revealed state (03 §6). Everything is drawn once, in its final place: the year where it was,
 * the three months in the zone that was the question, one y scale over both. The sealed year had the
 * same x and a tighter y scale. That map is affine, so the history only has to go from the sealed
 * placement to its final one: a CSS transform (scale and translate on y) animates that move, and the
 * path data is never animated.
 */
function Revealed({ reveal, height, plotWidth, bottom, cutX }: RevealedProps) {
  const { history, future } = reveal;
  const nh = history.length;
  const nf = future.length;

  const historyCloses = history.map((bar) => bar.c);
  const allCloses = [...historyCloses, ...future.map((bar) => bar.c)];
  const lo = Math.min(...allCloses);
  const hi = Math.max(...allCloses);
  /** A close as a fraction of the revealed price range, 0 at the bottom. */
  const unit = (c: number) => (hi === lo ? 0.5 : (c - lo) / (hi - lo));
  const yOf = (c: number) => bottom - unit(c) * (bottom - TOP);

  const historyXY = history.map((bar, i): [number, number] => [(i / (nh - 1)) * cutX, yOf(bar.c)]);
  const cutoff = history[nh - 1];
  const end = future[nf - 1];
  const futureXY: [number, number][] = [
    [cutX, yOf(cutoff.c)],
    ...future.map((bar, j): [number, number] => [cutX + ((j + 1) / nf) * (plotWidth - cutX), yOf(bar.c)]),
  ];
  const tip = futureXY[futureXY.length - 1];
  // The future line, area and tip take one colour, by the final close against the cutoff close.
  const up = end.c > cutoff.c;
  const colour = up ? 'var(--color-up)' : 'var(--color-down)';

  // From the sealed placement to the final one: y' = s * y + t. The sealed year spanned [lo1, hi1] over
  // the whole plot height; x does not change.
  const lo1 = Math.min(...historyCloses);
  const hi1 = Math.max(...historyCloses);
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
  const from = `translate(0px, ${ty.toFixed(2)}px) scale(1, ${sy.toFixed(4)})`;
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

      {/* The question zone's edge, already there before the decision, stays as the cutoff line. */}
      <CutLine cutX={cutX} height={height} />
      <g className="chart-labels">
        <circle cx={tip[0]} cy={tip[1]} r={10} className={up ? 'fill-up' : 'fill-down'} opacity={0.18} />
        <circle cx={tip[0]} cy={tip[1]} r={4.5} className={up ? 'fill-up' : 'fill-down'} />
      </g>
    </>
  );
}
