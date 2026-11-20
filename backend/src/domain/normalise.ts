/**
 * Min-max to [0, 1] over the shown window (02 §6). It keeps the shape and hides the price level
 * and the size of the moves (01 §14, decision 3). Scaling every price by the same factor gives the
 * same output, so a split-adjusted refresh of a series draws the same chart. A flat window is all
 * 0.5. Pure: the input is not modified.
 */
export function normalise(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((value) => (value - min) / (max - min));
}
