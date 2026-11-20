import type { Part, Tone } from '@/lib/copy';

// Whole class names, so Tailwind finds them.
const TONE_CLASS: Record<Tone, string> = {
  accent: 'text-accent',
  gold: 'text-gold',
  up: 'text-up',
  down: 'text-down',
};

/** A sentence from copy.ts; its figures get `figureClassName`, plus the colour of their tone if they have one. */
export function Sentence({ parts, figureClassName }: { parts: Part[]; figureClassName: string }) {
  return (
    <>
      {parts.map((part, i) =>
        part.figure ? (
          <span key={i} className={part.tone ? `${figureClassName} ${TONE_CLASS[part.tone]}` : figureClassName}>
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )}
    </>
  );
}
