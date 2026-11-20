import type { Metadata } from 'next';
import { copy } from '@/lib/copy';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: copy.titles.login };

// 03 §5.2. `?mode=signup` opens the form in create mode (the welcome's "Crear cuenta");
// `?expired=1` shows the session notice (api.ts, after the server rejected a token);
// `?demo=1`, the welcome's demo link, logs in with the demo account at once.
export default async function LoginPage(props: PageProps<'/login'>) {
  const { mode, expired, demo } = await props.searchParams;
  return <LoginForm initialMode={mode === 'signup' ? 'signup' : 'login'} sessionExpired={expired === '1'} demoNow={demo === '1'} />;
}
