import type { Part } from '@/lib/copy';
import { Sentence } from './Sentence';

/** The verdict, in the display face at the top of the stats screen; its figures bold, coloured by tone (03 §5.4). */
export function Verdict({ parts }: { parts: Part[] }) {
  return (
    <p className="font-display text-[22px] leading-[30px] font-medium tracking-[-0.01em] text-pretty">
      <Sentence parts={parts} figureClassName="font-bold tabular" />
    </p>
  );
}
