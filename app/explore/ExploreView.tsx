'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { PlanetCard } from '@/components/explore/PlanetCard';
import { useLanguage } from '@/lib/i18n/context';
import type { ExplorePlanetRow } from '@/types/database';

export function ExploreView({ planets }: { planets: ExplorePlanetRow[] }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return planets;
    return planets.filter(
      (p) =>
        p.username.includes(q) ||
        p.display_name.toLowerCase().includes(q) ||
        (p.bio ?? '').toLowerCase().includes(q)
    );
  }, [planets, query]);

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-space-void">
      <StarsBackground seed="explore" count={80} />
      <header className="relative z-10 flex items-center justify-between px-5 pb-4 pt-16 md:px-12">
        <Link href="/" className="text-lg font-medium tracking-[0.28em] text-star">
          ORBIT
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          {t('explore.create')}
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-8 md:px-12">
        <h1 className="text-4xl font-light text-star md:text-5xl">{t('explore.title')}</h1>
        <p className="mt-3 max-w-xl text-star-dim">{t('explore.subtitle')}</p>

        {planets.length > 0 ? (
          <label className="mt-8 flex max-w-md items-center gap-3 rounded-full border border-space-border bg-space-panel/70 px-5 py-3 backdrop-blur focus-within:border-accent">
            <Search className="h-4 w-4 text-star-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('explore.search')}
              className="w-full bg-transparent text-sm text-star outline-none placeholder:text-star-dim/70"
            />
          </label>
        ) : null}

        {planets.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-space-border bg-space-deep/60 p-10 text-center">
            <p className="text-star">{t('explore.empty')}</p>
            <Link
              href="/auth/sign-up"
              className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-medium text-white"
            >
              {t('explore.create')}
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-star-dim">{t('explore.noResults')}</p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((planet) => (
              <PlanetCard key={planet.username} planet={planet} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
