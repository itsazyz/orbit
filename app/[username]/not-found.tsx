'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PlanetVisual } from '@/components/planet/Planet3D';
import { DEFAULT_DESIGN, buildLook } from '@/lib/planet/design';

const LOST_PLANET = buildLook(
  { color: '#4a4f72', surface: 'cratered', atmosphere: 'none', glow: 1, mood: 'minimal', spaceBackground: 'void', seed: 'lost' },
  { ...DEFAULT_DESIGN, phase: 'back', moons: 1, color2: '#8a8fb5' }
);
import { useLanguage } from '@/lib/i18n/context';

export default function PlanetNotFound() {
  const { t } = useLanguage();
  const params = useParams<{ username: string }>();
  const wanted = (params?.username ?? '').toString().toLowerCase();
  const claimable = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(wanted);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-space-void px-6 text-center text-white">
      <div className="mb-8 opacity-80">
        <PlanetVisual look={LOST_PLANET} size={110} />
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
          href="/"
          className="rounded-full border border-space-border bg-space-panel px-6 py-3 text-sm hover:bg-space-nebula"
        >
          {t('planet.backHome')}
        </Link>
      </div>
    </main>
  );
}
