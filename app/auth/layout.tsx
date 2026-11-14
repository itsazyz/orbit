'use client';

import { Suspense } from 'react';

/** Top padding keeps page headers clear of the fixed language toggle. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-14">
      <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-star-dim">…</div>}>
        {children}
      </Suspense>
    </div>
  );
}
