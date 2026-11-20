import type { Metadata } from 'next';
import { copy } from '@/lib/copy';
import { ProvisionalPlay } from './ProvisionalPlay';

export const metadata: Metadata = { title: copy.titles.play };

// Provisional protected page of work unit 3; work unit 5 replaces it with the game.
export default function PlayPage() {
  return <ProvisionalPlay />;
}
