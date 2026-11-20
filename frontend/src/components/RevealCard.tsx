import type { Ref } from 'react';
import type { Reveal } from '@/lib/api-types';
import { copy } from '@/lib/copy';
import { dateFull, money } from '@/lib/format';
import { callLine, headline, liveLine } from '@/lib/reveal';
import type { LiveQuote } from '@/lib/api-types';

/** (P1) Today's price arrives after the reveal and may never arrive; the card is complete without it. */
export type LiveState = { kind: 'loading' } | { kind: 'done'; live: LiveQuote };

type Props = {
  reveal: Reveal;
  live: LiveState;
  onNext: () => void;
  nextRef: Ref<HTMLButtonElement>;
};

/** The reveal card, in the order of 03 §5.3. */
export function RevealCard({ reveal, live, onNext, nextRef }: Props) {
  const r = reveal.forwardReturn;
  const head = headline(r);
  const cutoffClose = reveal.history[reveal.history.length - 1].c;
  const endClose = reveal.future[reveal.future.length - 1].c;
  const sector = reveal.sector ? (copy.sectors[reveal.sector] ?? reveal.sector) : null;
  const place = [sector, reveal.exchange].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-col gap-1">
      <p className="truncate font-semibold">{copy.play.identity(reveal.symbol, reveal.name)}</p>
      {place && <p className="truncate text-sm text-muted">{place}</p>}
      <p className="text-sm">{copy.play.window(dateFull(reveal.startDate), dateFull(reveal.cutoffDate))}</p>
      <p className="text-sm">{copy.play.horizon(dateFull(reveal.endDate))}</p>
      {/* Number, arrow, colour and label all come from headline(): shown as 0.0%, no arrow and ink (03 §5.3). */}
      <p className={`mt-1 font-mono text-3xl ${head.colour}`}>
        {head.arrow && (
          <span role="img" aria-label={head.label ?? undefined}>
            {head.arrow}
          </span>
        )}
        {head.arrow && ' '}
        {head.value}
      </p>
      <p>{callLine(reveal.decision, r)}</p>
      <p className="font-mono text-sm">{copy.play.prices(money(cutoffClose), money(endClose))}</p>
      <p className="text-xs text-muted">{copy.play.priceNote}</p>
      <LiveLineView live={live} />
      <button ref={nextRef} type="button" onClick={onNext} className="button button-primary mt-2 min-h-14">
        {copy.play.next}
      </button>
    </div>
  );
}

/**
 * (P1) Today's price (03 §5.3). One line's height is always reserved: a placeholder while it loads,
 * then the price, or the muted note. The arrow and sign come from `liveLine`, never decided here.
 */
function LiveLineView({ live }: { live: LiveState }) {
  if (live.kind === 'loading') {
    return (
      <div aria-hidden="true" className="min-h-5">
        <div className="mt-1 h-3 w-48 rounded bg-muted/20" />
      </div>
    );
  }
  const line = liveLine(live.live);
  if (line.kind === 'note') return <p className="min-h-5 text-xs text-muted">{line.text}</p>;
  return (
    <p className="min-h-5 text-sm">
      {line.today}{' '}
      <span className={`font-mono ${line.head.colour}`}>
        {line.head.arrow && (
          <span role="img" aria-label={line.head.label ?? undefined}>
            {line.head.arrow}
          </span>
        )}
        {line.head.arrow && ' '}
        {line.head.value}
      </span>{' '}
      {line.since}
    </p>
  );
}
