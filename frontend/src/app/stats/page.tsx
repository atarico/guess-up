import type { Metadata } from 'next';
import { copy } from '@/lib/copy';
import { StatsScreen } from './StatsScreen';

export const metadata: Metadata = { title: copy.titles.stats };

// 03 §5.4. Client-rendered: the token lives in the browser (03 §2).
export default function StatsPage() {
  return <StatsScreen />;
}
