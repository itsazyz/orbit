import { Suspense } from 'react';
import { SignInForm } from './SignInForm';

export const dynamic = 'force-dynamic';

function SignInLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-star-dim">
      Loading…
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInForm />
    </Suspense>
  );
}
