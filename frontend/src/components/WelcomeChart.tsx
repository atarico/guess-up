import { copy } from '@/lib/copy';
import './WelcomeChart.css';

// The welcome screen's picture of the game (03 §5.1): a year of an invented price line, then a hidden
// zone with a question mark and two possible futures. Decoration only: it is not a real stock.

const WIDTH = 358;
const HEIGHT = 270;
/** Where the shown year ends and the hidden three months begin. */
const CUT = 258;
const POINTS = 140;

/** A small seeded generator (mulberry32), so the line is the same on every load and on the server. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random walk with some momentum, scaled into the shown zone; computed once, when the module loads. */
function inventedYear() {
  const random = seeded(90210);
  const bell = () => (random() + random() + random() + random() - 2) * 1.732;
  const values = [0];
  let momentum = 0;
  for (let i = 1; i < POINTS; i++) {
    momentum = 0.92 * momentum + 0.08 * bell();
    values.push(values[i - 1] + 0.0016 + 0.016 * (0.8 * bell() + 1.2 * momentum));
  }
  const low = Math.min(...values);
  const high = Math.max(...values);
  const points = values.map((v, i) => ({ x: (i / (POINTS - 1)) * CUT, y: 70 + (1 - (v - low) / (high - low)) * 160 }));
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const tip = points[points.length - 1];
  // Keep the two futures inside the picture.
  const within = (y: number) => Math.max(72, Math.min(248, y));
  return {
    line,
    area: `${line} L${CUT} ${HEIGHT} L0 ${HEIGHT} Z`,
    tip,
    up: `M${CUT} ${tip.y.toFixed(1)} Q304 ${tip.y.toFixed(1)} 350 ${within(tip.y - 84).toFixed(1)}`,
    down: `M${CUT} ${tip.y.toFixed(1)} Q304 ${tip.y.toFixed(1)} 350 ${within(tip.y + 78).toFixed(1)}`,
  };
}

const YEAR = inventedYear();

export function WelcomeChart() {
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={copy.welcome.heroLabel} className="block h-auto w-full overflow-visible">
        <defs>
          <linearGradient id="welcome-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
            <stop offset="94%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
          <pattern id="welcome-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="12" fill="var(--color-accent)" fillOpacity="0.08" />
          </pattern>
        </defs>

        {[90, 150, 210].map((y) => (
          <line key={y} x1={0} x2={CUT} y1={y} y2={y} className="stroke-grid" />
        ))}

        <g className="welcome-zone">
          <rect x={CUT} y={56} width={WIDTH - CUT} height={HEIGHT - 56} fill="url(#welcome-hatch)" />
          <line x1={CUT} x2={CUT} y1={56} y2={HEIGHT} className="welcome-zone-edge" />
        </g>

        <path d={YEAR.area} fill="url(#welcome-area)" className="welcome-area" />
        <g className="welcome-futures">
          <path d={YEAR.up} className="welcome-future welcome-future-up" />
          <path d={YEAR.down} className="welcome-future welcome-future-down" />
        </g>
        <path d={YEAR.line} pathLength={1} className="welcome-line" />
        <circle cx={CUT} cy={YEAR.tip.y} r={10} className="welcome-halo" />
        <circle cx={CUT} cy={YEAR.tip.y} r={4.5} className="welcome-tip" />

        <g className="welcome-question">
          <circle cx={308} cy={22} r={21} className="welcome-question-ring" />
          <text x={308} y={22} textAnchor="middle" dominantBaseline="central" className="welcome-question-mark">
            {copy.chart.unknown}
          </text>
        </g>
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs leading-[1.125rem] text-faint">
        <span>{copy.welcome.heroPast}</span>
        <span className="w-[28%] text-center whitespace-nowrap">{copy.welcome.heroFuture}</span>
      </figcaption>
    </figure>
  );
}
