/**
 * The guided tour of the play screen (03 §5.3): six steps the first time this browser plays, and again
 * on "¿Cómo funciona?". Per browser, not per account, so a visitor on the demo account sees it too. The
 * browser keeps only that the tour was finished or skipped: nothing about any round.
 */
export const TOUR_KEY = 'guess-up.tour.done';

/** Each step points at the element marked `data-tour="<target>"`. */
export type TourTarget = 'chart' | 'zone' | 'decide' | 'streak' | 'progress' | 'stats';
export const TOUR_ORDER: TourTarget[] = ['chart', 'zone', 'decide', 'streak', 'progress', 'stats'];

/** On load: the tour starts unless it was finished or skipped here. Storage that cannot be read counts as never. */
export function tourOnLoad(stored: string | null): boolean {
  return stored === null;
}

/**
 * The step after `from` (-1 to start) whose part is on screen, or null when the tour is over. A part
 * can be missing: the streak pill until /stats answers, the progress line from ten decided charts on.
 */
export function nextStep(from: number, onScreen: (target: TourTarget) => boolean): number | null {
  for (let i = from + 1; i < TOUR_ORDER.length; i++) {
    if (onScreen(TOUR_ORDER[i])) return i;
  }
  return null;
}

export type Box = { top: number; left: number; width: number; height: number };
export type Placement = { top: number; left: number; side: 'above' | 'below'; arrowLeft: number };

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/**
 * Where the bubble goes: below its part when it fits, else above, else on the roomier side; always
 * `margin` px inside the screen. `arrowLeft` is the arrow's x inside the bubble, at the part's middle
 * but never closer than 20 px to the bubble's corners.
 */
export function placeBubble(
  part: Box,
  bubble: { width: number; height: number },
  screen: { width: number; height: number },
  gap = 12,
  margin = 16,
): Placement {
  const below = part.top + part.height + gap;
  const above = part.top - gap - bubble.height;
  const fitsBelow = below + bubble.height <= screen.height - margin;
  const fitsAbove = above >= margin;
  const roomBelow = screen.height - (part.top + part.height);
  const side = fitsBelow ? 'below' : fitsAbove ? 'above' : roomBelow >= part.top ? 'below' : 'above';
  const top = clamp(side === 'below' ? below : above, margin, screen.height - margin - bubble.height);
  const middle = part.left + part.width / 2;
  const left = clamp(middle - bubble.width / 2, margin, screen.width - margin - bubble.width);
  return { top, left, side, arrowLeft: clamp(middle - left, 20, bubble.width - 20) };
}
