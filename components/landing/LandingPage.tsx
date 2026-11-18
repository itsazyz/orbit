'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Globe2, Link2, Orbit, Sparkles } from 'lucide-react';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { CosmicDust } from '@/components/universe/CosmicDust';
import { OrbitStage } from '@/components/universe/OrbitStage';
import { PlanetThumb } from '@/components/planet/PlanetThumb';
import { useLanguage } from '@/lib/i18n/context';
import { getHomepageStrings } from '@/lib/site-config/homepage-strings';
import { PLANET_SURFACE_CATALOG } from '@/lib/universe/planet-surfaces';
import { DEFAULT_DESIGN, buildLook, parseDesign, type PlanetDesign } from '@/lib/planet/design';
import type { HomepageContentConfig } from '@/lib/site-config/types';
import { formatCompact } from '@/lib/utils';

interface LandingPageProps {
  homepage: HomepageContentConfig;
  stats: { planets: number; stars: number } | null;
  signedIn: boolean;
}

const DEMO_SHAPES = ['sparkle', 'diamond', 'glow', 'comet', 'ring', 'classic'];

const SHOWCASE: Array<{ surface: string; color: string; atmosphere?: string; design: Partial<PlanetDesign> }> = [
  { surface: 'banded', color: '#e0a96d', design: { color2: '#8b4a2b', ring: 'classic', moons: 1 } },
  { surface: 'oceanic', color: '#3b9eff', design: { color2: '#5fd38a', moons: 1, effects: ['lights'] } },
  { surface: 'neon', color: '#7c8cff', atmosphere: 'electric', design: { color2: '#ff5ecf', ring: 'neon' } },
  { surface: 'volcanic', color: '#ff7a45', atmosphere: 'dusty', design: { color2: '#ffd56c', light: 'red' } },
  { surface: 'crystalline', color: '#c4b5fd', design: { color2: '#6cd9ff', ring: 'ice' } },
  { surface: 'eclipse', color: '#ffd56c', atmosphere: 'none', design: { color2: '#ff7eb3' } },
  { surface: 'forest', color: '#5fd38a', design: { color2: '#2f7fd8', effects: ['caps'], moons: 2 } },
  { surface: 'hologram', color: '#6cd9ff', atmosphere: 'none', design: { color2: '#c78cff', ring: 'cross' } },
  { surface: 'lava_veins', color: '#ff9d3c', atmosphere: 'thick', design: { color2: '#ffe08a' } },
  { surface: 'pearl', color: '#f0abfc', atmosphere: 'thick', design: { color2: '#ffd56c', ring: 'thin' } },
  { surface: 'cosmic', color: '#c78cff', design: { color2: '#6cd9ff', moons: 1 } },
  { surface: 'frozen', color: '#9fd8ff', design: { color2: '#3b82f6', effects: ['aurora'], phase: 'back', ring: 'double' } },
];
const DEMO_ICONS = ['✦', '♪', '☼', '◉', '★', '☾', '✈', '♡'];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: 'easeOut' },
} as const;

export function LandingPage({ homepage, stats, signedIn }: LandingPageProps) {
  const { t, lang } = useLanguage();
  const copy = getHomepageStrings(homepage, lang);
  const hero = homepage.heroPlanet;
  const heroLook = buildLook(
    {
      color: hero.color,
      surface: hero.surfaceStyle,
      atmosphere: hero.atmosphere,
      glow: hero.glow,
      mood: hero.mood,
      spaceBackground: hero.spaceBackground,
      seed: 'orbit-landing',
    },
    parseDesign({ ...DEFAULT_DESIGN, ...(hero.design ?? {}) }, hero.hasRing)
  );
  const startHref = signedIn ? '/create' : '/auth/sign-up';

  const demoStars = copy.examples.slice(0, 8).map((title, i) => ({
    id: `demo-${i}`,
    title,
    icon: DEMO_ICONS[i % DEMO_ICONS.length]!,
    visualType: DEMO_SHAPES[i % DEMO_SHAPES.length]!,
    category: i % 3 === 0 ? 'passion' : i % 3 === 1 ? 'value' : null,
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
              <a
                href="#planets"
                className="inline-flex h-13 items-center gap-2 rounded-full border border-space-border bg-space-panel/70 px-7 text-base text-star backdrop-blur transition hover:bg-space-nebula"
              >
                {t('home.seePlanets')}
              </a>
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
              planet={heroLook}
              stars={demoStars}
              labelMinScale={0.55}
              planetSize={140}
              render3d
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

      {/* ---------------- PLANET SHOWCASE ---------------- */}
      <section id="planets" className="relative overflow-hidden border-t border-space-border px-5 py-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="max-w-2xl">
            <h2 className="text-balance text-3xl font-light text-star md:text-4xl">{t('home.showcaseTitle')}</h2>
            <p className="mt-4 text-lg leading-relaxed text-star-dim">{t('home.showcaseText')}</p>
          </motion.div>
          <div className="mt-12 grid grid-cols-3 gap-x-2 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
            {SHOWCASE.map((item) => {
              const surface = PLANET_SURFACE_CATALOG.find((s) => s.id === item.surface)!;
              return (
                <div key={item.surface} className="flex flex-col items-center text-center">
                  <PlanetThumb
                    look={buildLook(
                      {
                        color: item.color,
                        surface: item.surface,
                        atmosphere: item.atmosphere ?? 'thin',
                        glow: 3,
                        mood: 'calm',
                        spaceBackground: 'deep_space',
                        seed: `showcase-${item.surface}`,
                      },
                      { ...DEFAULT_DESIGN, ...item.design }
                    )}
                    size={150}
                    extent={2.36}
                    hoverSpin
                  />
                  <p className="-mt-3 text-sm text-star">{lang === 'ar' ? surface.labelAr : surface.labelEn}</p>
                  <p className="text-xs text-star-dim">{lang === 'ar' ? surface.vibeAr : surface.vibeEn}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              href={startHref}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-medium text-white shadow-lg shadow-accent/25 hover:bg-accent/90"
            >
              {t('home.showcaseCta')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <p className="text-sm text-star-dim">{t('home.showcaseNote')}</p>
          </div>
        </div>
      </section>

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
          <Link href={signedIn ? '/dashboard' : '/auth/sign-in'} className="hover:text-star">
            {signedIn ? t('home.dashboard') : t('nav.signIn')}
          </Link>
        </div>
      </footer>
    </div>
  );
}
