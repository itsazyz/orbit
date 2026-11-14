'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import { useLanguage } from '@/lib/i18n/context';

export default function PlanetNotFound() {
  const { t } = useLanguage();
  const params = useParams<{ username: string }>();
  const wanted = (params?.username ?? '').toString().toLowerCase();
  const claimable = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(wanted);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-space-void px-6 text-center text-white">
      <div className="mb-8 opacity-80">
        <PlanetRenderer
          color="#3b3f5c"
          surfaceStyle="cratered"
          atmosphere="none"
          glow={1}
          hasRing={false}
          mood="minimal"
          spaceBackground="void"
          size={110}
          animate
          spin
        />
      </div>
      <h1 className="text-balance text-3xl font-semibold">{t('planet.notFoundTitle')}</h1>
      <p className="mx-auto mt-3 max-w-sm text-white/60">{t('planet.notFoundText')}</p>
      {claimable ? (
        <p className="mt-4 font-mono text-sm text-accent" dir="ltr">
          /{wanted}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={claimable ? `/auth/sign-up?claim=${wanted}` : '/auth/sign-up'}
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90"
        >
          {t('planet.notFoundCta')}
        </Link>
        <Link
          href="/explore"
          className="rounded-full border border-space-border bg-space-panel px-6 py-3 text-sm hover:bg-space-nebula"
        >
          {t('planet.explore')}
        </Link>
      </div>
    </main>
  );
}
