/** What can change the chart number on the top bar. */
export type ChartEvent =
  | { kind: 'stats'; rounds: number; decidedSinceAsked: boolean } // GET /stats answered
  | { kind: 'statsFailed' }
  | { kind: 'next' }; // the next chart is loading

/**
 * The "Gráfica N" of the top bar (03 §5.3): the number of the chart on screen, or null when it is not
 * known, and then the label is hidden. N is the rounds decided before this chart plus one. GET /stats
 * counts decided rounds only, so nothing here asks about the open round.
 *
 * An answer is used only if no decision was sent since it was asked: after one, it may or may not count
 * that decision, depending on which request the server handled first, so N could be off by one. A
 * dropped or failed answer leaves N unknown, and the page asks again when it loads the next chart.
 */
export function chartNumberAfter(current: number | null, event: ChartEvent): number | null {
  switch (event.kind) {
    case 'stats':
      return event.decidedSinceAsked ? current : event.rounds + 1;
    case 'statsFailed':
      return current;
    case 'next':
      return current === null ? null : current + 1;
  }
}
