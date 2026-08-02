'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

export function LandingPage() {
  const { t, dir, dict } = useLanguage();

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Hero */}
      <section className="relative flex min-h-dvh flex-col">
        <StarsBackground seed="landing-hero" count={100} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-space-void/50 to-space-void" />

        <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
          <span className="text-lg font-medium tracking-widest text-star">ORBIT</span>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link href="/auth/sign-in">
              <Button variant="ghost" size="sm">{t('nav.signIn')}</Button>
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
              color="#7c8cff"
              surfaceStyle="smooth"
              atmosphere="thin"
              glow={4}
              hasRing
              mood="calm"
              spaceBackground="deep_space"
              size={160}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-2xl text-balance text-4xl font-light leading-tight text-star md:text-6xl"
          >
            {t('landing.heroTitle')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-6 max-w-xl text-balance text-base leading-relaxed text-star-dim md:text-lg"
          >
            {t('landing.heroSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/auth/sign-up">
              <Button size="lg">
                {t('landing.createPlanet')}
                <ArrowRight className={cn('h-4 w-4', dir === 'rtl' && 'rotate-180')} />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="secondary" size="lg">{t('landing.seeHowItWorks')}</Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Sections */}
      <div id="how-it-works">
        <LandingSection
          title={t('landing.section1Title')}
          description={t('landing.section1Desc')}
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
          title={t('landing.section2Title')}
          description={t('landing.section2Desc')}
          reverse
          visual={
            <div className="flex flex-wrap justify-center gap-3">
              {dict.landing.examples.map((example, i) => (
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
          title={t('landing.section3Title')}
          description={t('landing.section3Desc')}
          visual={
            <div className="mx-auto w-48 rounded-3xl border-4 border-space-border bg-space-panel p-4 shadow-2xl">
              <div className="rounded-xl bg-space-deep p-3 text-center">
                <p className="text-xs text-star-dim">yourdomain.com</p>
                <p className="mt-1 text-sm font-medium text-accent">/username</p>
              </div>
            </div>
          }
        />

        <LandingSection
          title={t('landing.section4Title')}
          description={t('landing.section4Desc')}
          reverse
          visual={
            <div className="text-center">
              <p className="gradient-text text-3xl font-light">{t('tagline')}</p>
            </div>
          }
        />
      </div>

      {/* Footer CTA */}
      <footer className="border-t border-space-border px-6 py-20 text-center">
        <p className="text-lg text-star-dim">{t('landing.footerTagline')}</p>
        <p className="mt-2 text-2xl font-light text-star">{t('landing.footerCta')}</p>
        <Link href="/auth/sign-up" className="mt-8 inline-block">
          <Button size="lg">{t('landing.createPlanet')}</Button>
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
