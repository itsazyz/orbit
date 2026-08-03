'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function OrbitControlError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[orbit-control]', error);
  }, [error]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#05060a] px-6 text-center text-white">
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold">Could not load admin panel</h1>
        <p className="mt-3 text-slate-400">
          Check <code className="text-violet-400">ORBIT_ADMIN_EMAIL</code> and{' '}
          <code className="text-violet-400">SUPABASE_SERVICE_ROLE_KEY</code> in Vercel, then
          redeploy.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-slate-600">Digest: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/auth/sign-in?redirectTo=/orbit-control">
            <Button variant="secondary">Sign in again</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
