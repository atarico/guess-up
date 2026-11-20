'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

/** Signed-in visitors go straight to /play (03 §5.1). Renders nothing. */
export function RedirectIfSignedIn() {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === 'signedIn') router.replace('/play');
  }, [status, router]);
  return null;
}
