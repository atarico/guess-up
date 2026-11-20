'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';
import type { Reveal } from '@/lib/api-types';
import { copy } from '@/lib/copy';
import { dateFull, money } from '@/lib/format';

// 03 §6. Hand-written SVG: no axes, no values, no dates and no read-out on hover or touch before the
// decision; there are no pointer handlers and no <title>, which a browser would show as a tooltip.

/** The shown year takes the left 80%; the empty right 20% is the question, so nothing moves sideways at the reveal. */
const LINE_ZONE = 0.8;
/** 4% top and bottom, so the line never touches the edge. */
const PAD = 0.04;
/** Pixels at the bottom for the three dates, reserved in both states so the chart does not move at the reveal. */
const LABEL_BAND = 20;
/** Three faint hairlines for shape reference; they carry no labels. */
const HAIRLINES = [0.25, 0.5, 0.75];

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

const toPolyline = (xy: [number, number][]) => xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

export function Chart({ points, reveal }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const { width, height } = useBoxSize(box);

  const plotBottom = Math.max(0, height - LABEL_BAND);
  const top = plotBottom * PAD;
  const bottom = plotBottom * (1 - PAD);
  /** A value in [0, 1] to a y coordinate; 1 is the top. */
  const yOf = (v: number) => bottom - v * (bottom - top);
  const zoneX = width * LINE_ZONE;
  /** Bar i of n spread over the left 80%. */
  const xOf = (i: number, n: number) => (n <= 1 ? 0 : (i / (n - 1)) * zoneX);

  const sealedLine = toPolyline(points.map((p, i) => [xOf(i, points.length), yOf(p)]));

  const label = reveal
    ? copy.chart.revealedLabel(reveal.symbol, dateFull(reveal.startDate), dateFull(reveal.endDate))
    : copy.chart.sealedLabel;

  return (
    <div ref={box} className="h-full w-full">
      {width > 0 && height > 0 && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="block">
          {HAIRLINES.map((f) => (
            <line key={f} x1={0} x2={width} y1={yOf(f)} y2={yOf(f)} className="stroke-rule" strokeWidth={1} />
          ))}

          {!reveal && (
            <>
              <line x1={zoneX} x2={zoneX} y1={top} y2={bottom} className="stroke-muted" strokeWidth={1} strokeDasharray="4 4" />
              <text
                x={zoneX + (width - zoneX) / 2}
                y={(top + bottom) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted text-2xl"
              >
                {copy.chart.unknown}
              </text>
              {points.length > 0 && <polyline points={sealedLine} className="chart-ink" />}
            </>
          )}

          {reveal && <Revealed reveal={reveal} sealedLine={sealedLine} width={width} height={height} zoneX={zoneX} yOf={yOf} xOf={xOf} />}
        </svg>
      )}
    </div>
  );
}

type RevealedProps = {
  reveal: Reveal;
  sealedLine: string;
  width: number;
  height: number;
  zoneX: number;
  yOf: (v: number) => number;
  xOf: (i: number, n: number) => number;
};

/** The revealed state, drawn in the sequence of 03 §6; the CSS in globals.css times it. */
function Revealed({ reveal, sealedLine, width, height, zoneX, yOf, xOf }: RevealedProps) {
  const { history, future } = reveal;
  // 1. One vertical scale over history and future together.
  const closes = [...history, ...future].map((bar) => bar.c);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const scaled = (c: number) => (max === min ? 0.5 : (c - min) / (max - min));

  const cutoff = history[history.length - 1];
  const end = future[future.length - 1];
  const up = end.c > cutoff.c;
  const cutoffY = yOf(scaled(cutoff.c));
  const endY = yOf(scaled(end.c));

  const historyLine = toPolyline(history.map((bar, i) => [xOf(i, history.length), yOf(scaled(bar.c))]));
  // 2. The future fills the right 20%, starting from the cutoff point and ending just inside the
  // right edge, so the end dot is not cut.
  const right = width - 4;
  const futureLine = toPolyline([
    [zoneX, cutoffY],
    ...future.map((bar, j): [number, number] => [zoneX + ((j + 1) / future.length) * (right - zoneX), yOf(scaled(bar.c))]),
  ]);

  // A price label sits just above its dot, or just below when the dot is at the top.
  const labelY = (y: number) => (y - 8 < 10 ? y + 16 : y - 8);
  const dateY = height - 5;

  return (
    <>
      {/* The sealed line fades out while the history redraws on the new scale. */}
      <polyline points={sealedLine} className="chart-ink chart-fade-out" />
      <polyline points={historyLine} className="chart-ink chart-fade-in" />
      <polyline points={futureLine} pathLength={1} className={`chart-future ${up ? 'stroke-up' : 'stroke-down'}`} />

      {/* 3. Labels: three dates and two prices, and a dot at the cutoff and at the end. */}
      <g className="chart-labels font-mono text-[10px]">
        <circle cx={zoneX} cy={cutoffY} r={3.5} className="fill-ink" />
        <circle cx={right} cy={endY} r={3.5} className={up ? 'fill-up' : 'fill-down'} />
        <text x={zoneX - 6} y={labelY(cutoffY)} textAnchor="end" className="fill-ink">
          {money(cutoff.c)}
        </text>
        <text x={width} y={labelY(endY)} textAnchor="end" className={up ? 'fill-up' : 'fill-down'}>
          {money(end.c)}
        </text>
        <text x={0} y={dateY} textAnchor="start" className="fill-muted">
          {dateFull(reveal.startDate)}
        </text>
        <text x={zoneX - 2} y={dateY} textAnchor="end" className="fill-muted">
          {dateFull(reveal.cutoffDate)}
        </text>
        <text x={width} y={dateY} textAnchor="end" className="fill-muted">
          {dateFull(reveal.endDate)}
        </text>
      </g>
    </>
  );
}
