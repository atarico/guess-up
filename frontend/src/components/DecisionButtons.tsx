import { copy } from '@/lib/copy';

type Props = {
  disabled: boolean;
  onDecide: (decision: 'buy' | 'pass') => void;
};

/**
 * Pass on the left, buy on the right (03 §5.3). The same class for both: identical size, weight,
 * border and fill, no "primary", so the interface never nudges. 56 px tall, 12 px apart.
 */
export function DecisionButtons({ disabled, onDecide }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" disabled={disabled} onClick={() => onDecide('pass')} className="button button-secondary min-h-14">
        {copy.play.pass}
      </button>
      <button type="button" disabled={disabled} onClick={() => onDecide('buy')} className="button button-secondary min-h-14">
        {copy.play.buy}
      </button>
    </div>
  );
}
