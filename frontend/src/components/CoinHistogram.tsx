import type { CoinHistogram as Histogram } from '@/lib/api-types';
import { copy } from '@/lib/copy';
import { count, signedPoints } from '@/lib/format';
import { histogramView } from '@/lib/statsView';

type Props = { histogram: Histogram; p5: number; p95: number; edge: number; trials: number };

/** Keeps the "Tú" pill, which is centred on the marker, from running off either side. */
const clamp = (x: number) => Math.min(88, Math.max(12, x));

/**
 * The coin card's drawing (03 §5.4): the 2,000 coins' edges in bins, the 90% band from p5 to p95 in
 * gold (the bins inside it too, the rest dim), the user's marker and the axis. All geometry comes
 * from `histogramView`; this only places it. Fluid width, fixed height.
 */
export function CoinHistogram({ histogram, p5, p95, edge, trials }: Props) {
  const view = histogramView(histogram, p5, p95, edge);
  const you = copy.statsCards.coin.you(signedPoints(edge));

  return (
    <div role="img" aria-label={copy.statsCards.coin.histogramLabel(count(trials))} className="relative h-[172px] w-full">
      <div
        className="absolute top-[34px] h-[110px] border-x border-dashed border-gold/70 bg-gold/10"
        style={{ left: `${view.band.left}%`, width: `${view.band.width}%` }}
      />
      <div className="absolute inset-x-0 top-[34px] h-[110px]">
        {view.bins.map((bin, k) => (
          <div
            key={k}
            className={`stats-bin absolute bottom-0 rounded-t-[2px] ${bin.inBand ? 'bg-gold' : 'bg-off'}`}
            // A 1 px gap between bins; the delay ripples from the left.
            style={{ left: `${bin.left}%`, width: `calc(${bin.width}% - 1px)`, height: `${bin.height}%`, animationDelay: `${k * 12}ms` }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 top-[144px] h-px bg-line-strong" />
      <div
        className="stats-marker absolute top-[26px] -ml-px h-[118px] w-0.5 rounded-[1px] bg-accent"
        style={{ left: `${view.marker}%`, '--from': `${view.zero}%` } as React.CSSProperties}
      />
      <div
        className="stats-marker absolute top-0 flex h-[22px] -translate-x-1/2 items-center rounded-full bg-accent px-2 text-xs font-semibold whitespace-nowrap text-page tabular"
        style={{ left: `${clamp(view.marker)}%`, '--from': `${clamp(view.zero)}%` } as React.CSSProperties}
      >
        {you}
      </div>
      <div className="absolute inset-x-0 top-[150px] h-[18px] text-[11px] leading-[18px] text-faint tabular">
        {view.ticks.map((tick) => (
          <span key={tick.label} className="absolute -translate-x-1/2" style={{ left: `${tick.left}%` }}>
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  );
}
