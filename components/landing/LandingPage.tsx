'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Globe2, Link2, Orbit, Sparkles } from 'lucide-react';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { CosmicDust } from '@/components/universe/CosmicDust';
import { OrbitStage } from '@/components/universe/OrbitStage';
import { PlanetCard } from '@/components/explore/PlanetCard';
import { useLanguage } from '@/lib/i18n/context';
import { getHomepageStrings } from '@/lib/site-config/homepage-strings';
import { normalizePlanetSurface } from '@/lib/universe/planet-surfaces';
import type { HomepageContentConfig } from '@/lib/site-config/types';
import type { ExplorePlanetRow } from '@/types/database';
import { formatCompact } from '@/lib/utils';

interface LandingPageProps {
  homepage: HomepageContentConfig;
  stats: { planets: number; stars: number } | null;
  featured: ExplorePlanetRow[];
  signedIn: boolean;
}

const DEMO_SHAPES = ['sparkle', 'diamond', 'glow', 'comet', 'ring', 'classic'];
const DEMO_ICONS = ['✦', '♪', '☼', '◉', '★', '☾', '✈', '♡'];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: 'easeOut' },
};

export function LandingPage({ homepage, stats, featured, signedIn }: LandingPageProps) {
  const { t, lang } = useLanguage();
  const copy = getHomepageStrings(homepage, lang);
  const hero = homepage.heroPlanet;
  const startHref = signedIn ? '/create' : '/auth/sign-up';

  const demoStars = copy.examples.slice(0, 8).map((title, i) => ({
    id: `demo-${i}`,
    title,
    icon: DEMO_ICONS[i % DEMO_ICONS.length]!,
    visualType: DEMO_SHAPES[i % DEMO_SHAPES.length]!,
  }));

  const showStats = !!stats && stats.planets >= 3;

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* ---------------- HERO ---------------- */}
      <section className="relative flex min-h-dvh flex-col">
        <StarsBackground seed="landing-hero" count={120} />
        <CosmicDust seed="landing-dust" count={36} color={`${hero.color}55`} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 70% 45%, ${hero.color}22 0%, transparent 45%), linear-gradient(to bottom, transparent, rgba(5,6,10,0.4) 60%, #05060a 100%)`,
          }}
        />

        <header className="relative z-10 flex items-center justify-between px-5 pb-4 pt-16 md:px-12">
          <Link href="/" className="text-lg font-medium tracking-[0.28em] text-star">
            {copy.siteName}
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/explore" className="rounded-full px-3 py-2 text-sm text-star-dim hover:text-star">
              {t('home.explore')}
            </Link>
            <Link
              href={signedIn ? '/dashboard' : '/auth/sign-in'}
              className="rounded-full px-3 py-2 text-sm text-star-dim hover:text-star"
            >
              {signedIn ? t('home.dashboard') : t('nav.signIn')}
            </Link>
          </nav>
        </header>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-5 pb-16 md:grid-cols-[1.05fr_1fr] md:px-12">
          <div className="order-2 text-center md:order-1 md:text-start">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
              className="text-balance text-4xl font-light leading-[1.08] text-star sm:text-5xl md:text-6xl"
            >
              {copy.heroTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.25 }}
              className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-star-dim md:mx-0 md:text-lg"
            >
              {copy.heroSubtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3 md:justify-start"
            >
              <Link
                href={startHref}
                className="inline-flex h-13 items-center gap-2 rounded-full bg-accent px-8 text-base font-medium text-white shadow-lg shadow-accent/25 transition hover:bg-accent/90"
              >
                {copy.createPlanet}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex h-13 items-center gap-2 rounded-full border border-space-border bg-space-panel/70 px-7 text-base text-star backdrop-blur transition hover:bg-space-nebula"
              >
                {t('home.explore')}
              </Link>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.6 }}
              className="mt-4 text-xs text-star-dim/80"
            >
              {t('home.freeNote')}
            </motion.p>

            {showStats ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.75 }}
                className="mt-10 flex justify-center gap-10 md:justify-start"
              >
                <div>
                  <p className="text-3xl font-light text-star">{formatCompact(stats!.planets, lang)}</p>
                  <p className="text-xs text-star-dim">{t('home.statPlanets')}</p>
                </div>
                <div>
                  <p className="text-3xl font-light text-star">{formatCompact(stats!.stars, lang)}</p>
                  <p className="text-xs text-star-dim">{t('home.statStars')}</p>
                </div>
              </motion.div>
            ) : null}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
            className="order-1 h-[min(48svh,460px)] min-h-[300px] md:order-2 md:h-[540px]"
          >
            <OrbitStage
              planet={{
                color: hero.color,
                surfaceStyle: normalizePlanetSurface(hero.surfaceStyle),
                atmosphere: hero.atmosphere,
                glow: hero.glow,
                hasRing: hero.hasRing,
                mood: hero.mood,
                spaceBackground: hero.spaceBackground,
              }}
              stars={demoStars}
              labelMinScale={0.55}
              planetSize={140}
            />
          </motion.div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="how-it-works" className="border-t border-space-border px-5 py-24 md:px-12">
        <motion.h2 {...fadeUp} className="text-center text-3xl font-light text-star md:text-4xl">
          {t('home.howTitle')}
        </motion.h2>
        <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
          {[
            { icon: Orbit, title: t('home.how1'), desc: t('home.how1d') },
            { icon: Sparkles, title: t('home.how2'), desc: t('home.how2d') },
            { icon: Link2, title: t('home.how3'), desc: t('home.how3d') },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              {...fadeUp}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className="rounded-3xl border border-space-border bg-space-deep/60 p-7"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-sm text-star-dim">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-xl text-star">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-star-dim">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- FEATURED ---------------- */}
      {featured.length > 0 ? (
        <section className="border-t border-space-border px-5 py-24 md:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <motion.h2 {...fadeUp} className="text-3xl font-light text-star md:text-4xl">
                {t('home.featuredTitle')}
              </motion.h2>
              <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-accent hover:text-star">
                {t('home.featuredCta')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {featured.slice(0, 8).map((planet) => (
                <PlanetCard key={planet.username} planet={planet} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------- FEATURES (admin-editable copy) ---------------- */}
      <section className="border-t border-space-border px-5 py-24 md:px-12">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-light text-star md:text-4xl">{t('home.compareTitle')}</h2>
            <p className="mt-4 text-lg leading-relaxed text-star-dim">{t('home.compareText')}</p>
          </motion.div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {[
              { title: copy.section1Title, desc: copy.section1Desc, icon: Orbit },
              { title: copy.section2Title, desc: copy.section2Desc, icon: Sparkles },
              { title: copy.section3Title, desc: copy.section3Desc, icon: Link2 },
              { title: copy.section4Title, desc: copy.section4Desc, icon: Globe2 },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ duration: 0.7, delay: (i % 2) * 0.1 }}
                className="rounded-3xl border border-space-border bg-gradient-to-b from-space-panel/60 to-space-deep/40 p-7"
              >
                <item.icon className="h-5 w-5 text-accent" />
                <h3 className="mt-4 text-xl text-star">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-star-dim">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="border-t border-space-border px-5 py-24 md:px-12">
        <div className="mx-auto max-w-3xl">
          <motion.h2 {...fadeUp} className="text-center text-3xl font-light text-star md:text-4xl">
            {t('home.faqTitle')}
          </motion.h2>
          <div className="mt-10 divide-y divide-space-border rounded-3xl border border-space-border bg-space-deep/50">
            {[1, 2, 3, 4].map((n) => (
              <details key={n} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-star">
                  {t(`home.faq${n}q`)}
                  <span className="text-star-dim transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-star-dim">{t(`home.faq${n}a`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER CTA ---------------- */}
      <footer className="relative overflow-hidden border-t border-space-border px-6 pb-12 pt-24 text-center">
        <div
          className="pointer-events-none absolute bottom-[-180px] left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `${hero.color}33` }}
          aria-hidden
        />
        <p className="relative text-lg text-star-dim">{copy.footerTagline}</p>
        <p className="relative mt-2 text-3xl font-light text-star md:text-4xl">{copy.footerCta}</p>
        <Link
          href={startHref}
          className="relative mt-9 inline-flex h-13 items-center gap-2 rounded-full bg-accent px-8 text-base font-medium text-white shadow-lg shadow-accent/25 hover:bg-accent/90"
        >
          {copy.createPlanet}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
        <div className="relative mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-star-dim">
          <span className="tracking-[0.28em]">{copy.siteName}</span>
          <Link href="/explore" className="hover:text-star">
            {t('home.explore')}
          </Link>
          <Link href={signedIn ? '/dashboard' : '/auth/sign-in'} className="hover:text-star">
            {signedIn ? t('home.dashboard') : t('nav.signIn')}
          </Link>
        </div>
      </footer>
    </div>
  );
}
