import type { Reveal } from './api-types';
import { copy } from './copy';

/**
 * The call line of 03 §5.3, decided on the raw return with the backend's isCorrect boundary: "flat" is
 * exactly zero. A rise too small to show, printed as 0.0%, is still a rise and still a good buy.
 */
export function callLine(decision: Reveal['decision'], r: number): string {
  if (decision === 'buy') {
    if (r > 0) return copy.play.calls.buyUp;
    return r === 0 ? copy.play.calls.buyFlat : copy.play.calls.buyDown;
  }
  return r > 0 ? copy.play.calls.passUp : copy.play.calls.passDownOrFlat;
}

/** The arrow and its accessible label (03 §4, §10): a gain or a loss is never shown by colour alone. */
export function direction(r: number): { arrow: string; label: string; colour: string } | null {
  if (r > 0) return { arrow: '▲', label: copy.play.up, colour: 'text-up' };
  if (r < 0) return { arrow: '▼', label: copy.play.down, colour: 'text-down' };
  return null;
}
