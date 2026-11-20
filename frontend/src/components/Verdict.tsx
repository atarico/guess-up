import type { Part } from '@/lib/copy';
import { Sentence } from './Sentence';

/** The verdict, in the largest type on the stats screen; its figures in bold monospace (03 §5.4). */
export function Verdict({ parts }: { parts: Part[] }) {
  return (
    <p className="text-2xl leading-snug text-pretty">
      <Sentence parts={parts} figureClassName="font-mono font-bold" />
    </p>
  );
}
