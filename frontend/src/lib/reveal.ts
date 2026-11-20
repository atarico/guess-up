import type { LiveQuote, Reveal } from './api-types';
import { copy } from './copy';
import { money, percent } from './format';

/**
 * What happened, as the call line of 03 §5.3, decided on the raw return with the backend's isCorrect boundary: "flat" is
 * exactly zero. A rise too small to show, printed as 0.0%, is still a rise. Whether the call was right
 * is `reveal.correct`, shown beside it.
 */
export function callLine(decision: Reveal['decision'], r: number): string {
  const outcome = r > 0 ? 'up' : r === 0 ? 'flat' : 'down';
  return copy.play.call[decision][outcome];
}

export type Headline = { value: string; arrow: string | null; label: string | null; colour: string };

/**
 * The reveal's headline (03 §5.3, §4, §10): the number as shown, and its arrow, colour and accessible
 * label, all decided here from that one rounded number, so they never disagree. `percent` signs the
 * rounded value, so a return shown as 0.0% has no sign: no arrow, and `fg`. A gain or a loss is never
 * shown by colour alone. The call line keeps the raw return (`callLine`).
 */
export function headline(r: number): Headline {
  const value = percent(r);
  if (value.startsWith('+')) return { value, arrow: '▲', label: copy.play.up, colour: 'text-up' };
  // U+2212, the real minus sign percent() writes.
  if (value.startsWith('\u2212')) return { value, arrow: '▼', label: copy.play.down, colour: 'text-down' };
  return { value, arrow: null, label: null, colour: 'text-fg' };
}

/** What the reveal card shows for today's price (P1): the price line, or a muted note. */
export type LiveLine =
  | { kind: 'price'; today: string; head: Headline; since: string }
  | { kind: 'note'; text: string };

/**
 * The live line of 03 §5.3. The arrow and the percent of the move since the cutoff come from
 * `headline`, the one rule for direction, so this line can never contradict its own number.
 */
export function liveLine(live: LiveQuote): LiveLine {
  if (!live.available) return { kind: 'note', text: live.reason === 'limit' ? copy.play.live.limit : copy.play.live.unavailable };
  return { kind: 'price', today: copy.play.live.today(money(live.price)), head: headline(live.sinceCutoff), since: copy.play.live.sinceThen };
}
