import type { Ref } from 'react';
import type { Reveal } from '@/lib/api-types';
import { copy } from '@/lib/copy';
import { dateFull, money } from '@/lib/format';
import { callLine, headline } from '@/lib/reveal';

type Props = {
  reveal: Reveal;
  onNext: () => void;
  nextRef: Ref<HTMLButtonElement>;
};

/** The reveal card, in the order of 03 §5.3. */
export function RevealCard({ reveal, onNext, nextRef }: Props) {
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
      {/* Reserved for the (P1) line with today's price, so the card does not grow when it arrives. */}
      <div aria-hidden="true" className="h-5" />
      <button ref={nextRef} type="button" onClick={onNext} className="button button-primary mt-2 min-h-14">
        {copy.play.next}
      </button>
    </div>
  );
}
