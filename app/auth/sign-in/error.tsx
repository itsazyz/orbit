'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function SignInError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#020308] px-6 text-center text-white">
      <div className="max-w-md">
        <h1 className="text-xl font-semibold">Sign-in error</h1>
        <p className="mt-3 text-sm text-slate-400">
          Try again or open the admin page directly after signing in from the home page.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-slate-600">Digest: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/auth/sign-in?redirectTo=/orbit-control">
            <Button variant="secondary">Reload sign in</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
