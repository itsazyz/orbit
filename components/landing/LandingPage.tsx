'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { CosmicDust } from '@/components/universe/CosmicDust';
import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import { useLanguage } from '@/lib/i18n/context';
import { getHomepageStrings } from '@/lib/site-config/homepage-strings';
import type { HomepageContentConfig } from '@/lib/site-config/types';
import type { SiteSettingsConfig } from '@/lib/site-config/types';
import { cn } from '@/lib/utils';

interface LandingPageProps {
  homepage: HomepageContentConfig;
  siteSettings: SiteSettingsConfig;
}

export function LandingPage({ homepage, siteSettings }: LandingPageProps) {
  const { t: translate, dir, lang } = useLanguage();
  const copy = getHomepageStrings(homepage, lang);
  const hero = homepage.heroPlanet;

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Announcement banner is rendered site-wide in root layout */}
      {/* Hero */}
      <section className="relative flex min-h-dvh flex-col">
        <StarsBackground seed="landing-hero" count={120} />
        <CosmicDust seed="landing-dust" count={36} color={`${hero.color}55`} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 38%, ${hero.color}22 0%, transparent 42%), linear-gradient(to bottom, transparent, rgba(5,6,10,0.55) 55%, #05060a 100%)`,
          }}
        />

        <header className="relative z-10 flex items-center justify-between px-6 pt-16 pb-6 md:px-12 md:pt-16">
          <span className="text-lg font-medium tracking-[0.28em] text-star">
            {copy.siteName}
          </span>
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-in">
              <Button variant="ghost" size="sm">{translate('nav.signIn')}</Button>
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="relative mb-12"
          >
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{ background: `${hero.color}33` }}
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            >
              <PlanetRenderer
                color={hero.color}
                surfaceStyle={hero.surfaceStyle}
                atmosphere={hero.atmosphere}
                glow={hero.glow}
                hasRing={hero.hasRing}
                mood={hero.mood}
                spaceBackground={hero.spaceBackground}
                size={hero.size}
                animate
                spin
              />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-2xl text-balance text-4xl font-light leading-tight text-star md:text-6xl"
          >
            {copy.heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-6 max-w-xl text-balance text-base leading-relaxed text-star-dim md:text-lg"
          >
            {copy.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/auth/sign-up">
              <Button size="lg">
                {copy.createPlanet}
                <ArrowRight className={cn('h-4 w-4', dir === 'rtl' && 'rotate-180')} />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="secondary" size="lg">{copy.seeHowItWorks}</Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Sections */}
      <div id="how-it-works">
        <LandingSection
          title={copy.section1Title ?? ''}
          description={copy.section1Desc ?? ''}
          visual={
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-accent-calm/20 blur-2xl" />
              <PlanetRenderer
                color="#6cd9ff"
                surfaceStyle="banded"
                atmosphere="thick"
                glow={4}
                hasRing
                mood="creative"
                spaceBackground="nebula"
                size={130}
                animate
                spin
              />
            </div>
          }
        />

        <LandingSection
          title={copy.section2Title ?? ''}
          description={copy.section2Desc ?? ''}
          reverse
          visual={
            <div className="flex flex-wrap justify-center gap-3">
              {copy.examples.map((example, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-star-dim shadow-[0_0_24px_rgba(124,140,255,0.08)] backdrop-blur-sm"
                >
                  {example}
                </motion.span>
              ))}
            </div>
          }
        />

        <LandingSection
          title={copy.section3Title ?? ''}
          description={copy.section3Desc ?? ''}
          visual={
            <div className="mx-auto w-48 rounded-3xl border-4 border-space-border bg-space-panel p-4 shadow-2xl">
              <div className="rounded-xl bg-space-deep p-3 text-center">
                <p className="text-xs text-star-dim">{copy.demoDomain}</p>
                <p className="mt-1 text-sm font-medium text-accent">/username</p>
              </div>
            </div>
          }
        />

        <LandingSection
          title={copy.section4Title ?? ''}
          description={copy.section4Desc ?? ''}
          reverse
          visual={
            <div className="text-center">
              <p className="gradient-text text-3xl font-light">{copy.tagline}</p>
            </div>
          }
        />
      </div>

      {/* Footer CTA */}
      <footer className="border-t border-space-border px-6 py-20 text-center">
        <p className="text-lg text-star-dim">{copy.footerTagline}</p>
        <p className="mt-2 text-2xl font-light text-star">{copy.footerCta}</p>
        <Link href="/auth/sign-up" className="mt-8 inline-block">
          <Button size="lg">{copy.createPlanet}</Button>
        </Link>
      </footer>
    </div>
  );
}

function LandingSection({
  title,
  description,
  visual,
  reverse = false,
}: {
  title: string;
  description: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="border-t border-space-border px-6 py-24 md:px-12">
      <div
        className={cn(
          'mx-auto flex max-w-5xl flex-col items-center gap-12 md:flex-row',
          reverse && 'md:flex-row-reverse'
        )}
      >
        <div className="flex-1 text-center md:text-start">
          <h2 className="text-3xl font-light text-star md:text-4xl">{title}</h2>
          <p className="mt-4 text-star-dim leading-relaxed">{description}</p>
        </div>
        <div className="flex flex-1 items-center justify-center">{visual}</div>
      </div>
    </section>
  );
}
