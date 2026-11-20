import type { Metadata } from 'next';
import { copy } from '@/lib/copy';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: copy.titles.login };

// 03 §5.2. `?mode=signup` opens the form in create mode (the welcome's "Empezar");
// `?expired=1` shows the session notice (api.ts, after the server rejected a token).
export default async function LoginPage(props: PageProps<'/login'>) {
  const { mode, expired } = await props.searchParams;
  return <LoginForm initialMode={mode === 'signup' ? 'signup' : 'login'} sessionExpired={expired === '1'} />;
}
