import { copy } from '@/lib/copy';

type Props = {
  disabled: boolean;
  onDecide: (decision: 'buy' | 'pass') => void;
};

/**
 * Buy on the left, pass on the right (03 §5.3). The same classes for both: identical size, weight,
 * border and fill, no "primary", so the interface never nudges. 64 px tall, 12 px apart.
 */
const decisionButton = 'button h-16 border-edge bg-raised font-display text-[18px] text-fg enabled:hover:bg-well';

export function DecisionButtons({ disabled, onDecide }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" disabled={disabled} onClick={() => onDecide('buy')} className={decisionButton}>
        {copy.play.buy}
      </button>
      <button type="button" disabled={disabled} onClick={() => onDecide('pass')} className={decisionButton}>
        {copy.play.pass}
      </button>
    </div>
  );
}
