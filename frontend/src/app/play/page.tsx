import type { Metadata } from 'next';
import { copy } from '@/lib/copy';
import { PlayScreen } from './PlayScreen';

export const metadata: Metadata = { title: copy.titles.play };

// 03 §5.3. Client-rendered: the token lives in the browser (03 §2).
export default function PlayPage() {
  return <PlayScreen />;
}
