'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import { useLanguage } from '@/lib/i18n/context';
import { getHomepageStrings } from '@/lib/site-config/load';
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
      {siteSettings.showAnnouncement ? (
        <div className="relative z-20 border-b border-violet-500/30 bg-violet-500/10 px-4 py-2 text-center text-sm text-violet-100">
          {lang === 'ar' ? siteSettings.announcementAr : siteSettings.announcementEn}
        </div>
      ) : null}

      {/* Hero */}
      <section className="relative flex min-h-dvh flex-col">
        <StarsBackground seed="landing-hero" count={100} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-space-void/50 to-space-void" />

        <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
          <span className="text-lg font-medium tracking-widest text-star">
            {copy.siteName}
          </span>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link href="/auth/sign-in">
              <Button variant="ghost" size="sm">{translate('nav.signIn')}</Button>
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="mb-12"
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
            />
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
            <PlanetRenderer
              color="#6cd9ff"
              surfaceStyle="banded"
              atmosphere="thick"
              glow={3}
              hasRing={false}
              mood="creative"
              spaceBackground="nebula"
              size={120}
            />
          }
        />

        <LandingSection
          title={copy.section2Title ?? ''}
          description={copy.section2Desc ?? ''}
          reverse
          visual={
            <div className="flex flex-wrap justify-center gap-3">
              {copy.examples.map((example, i) => (
                <span
                  key={i}
                  className="rounded-full border border-space-border bg-space-panel px-4 py-2 text-sm text-star-dim"
                >
                  {example}
                </span>
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
