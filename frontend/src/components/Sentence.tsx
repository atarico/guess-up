import type { Part } from '@/lib/copy';

/** A sentence from copy.ts; its figures get `figureClassName` (monospace, and bold in the verdict). */
export function Sentence({ parts, figureClassName }: { parts: Part[]; figureClassName: string }) {
  return (
    <>
      {parts.map((part, i) =>
        part.figure ? (
          <span key={i} className={figureClassName}>
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )}
    </>
  );
}
