/**
 * The "how it works" card in the question block (03 §5.3): three lines the first time this browser
 * plays, and again on "¿Cómo funciona?". Per browser, not per account, so a visitor on the demo account
 * sees it too. The browser keeps only that a decision was made here: nothing about any round.
 */
export const SEEN_KEY = 'guess-up.howItWorks.seen';

/** `asked`: the "¿Cómo funciona?" button. The card lives in the question block, so the reveal never shows it. */
export type CardEvent = 'decided' | 'asked';

/** On load: shown when this browser has no decision stored, or when storage cannot be read. */
export function cardOnLoad(stored: string | null): boolean {
  return stored === null;
}

/** Whatever it was before: a decision takes the card away, and only "¿Cómo funciona?" brings it back. */
export function cardAfter(event: CardEvent): boolean {
  return event === 'asked';
}
