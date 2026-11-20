import { copy } from '@/lib/copy';

/**
 * The app's mark and name, at the top of every screen (03 §4): a rising line ending in the gold dot
 * of the question. The mark is decoration; the name is the text.
 */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
        <rect width="28" height="28" rx="8" className="fill-raised" />
        <path d="M6 18 L11 13 L15 16 L21 9" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" />
        <circle cx="21" cy="9" r="2.4" className="fill-gold" />
      </svg>
      <span translate="no" className="font-display text-lg font-bold tracking-[-0.01em] whitespace-nowrap">
        {copy.appTitle}
      </span>
    </span>
  );
}
