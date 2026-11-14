import type { Metadata, Viewport } from 'next';
import { Inter, Cairo } from 'next/font/google';
import { cookies } from 'next/headers';
import { LanguageProvider } from '@/lib/i18n/context';
import { GlobalLanguageBar } from '@/components/layout/GlobalLanguageBar';
import { SiteAnnouncementBar } from '@/components/layout/SiteAnnouncementBar';
import { LANGUAGE_COOKIE, parseLanguage } from '@/lib/i18n';
import { loadSiteSettingsServer } from '@/lib/site-config/load';
import { getSiteUrl } from '@/lib/utils';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'ORBIT — Every person is a universe.',
    template: '%s',
  },
  description:
    'Create a visual personal universe: a planet that is you, surrounded by the things that shape you. Share it with one link.',
  applicationName: 'ORBIT',
  openGraph: {
    title: 'ORBIT — Every person is a universe.',
    description: 'Create a planet that reflects who you are and share your world through one link.',
    type: 'website',
    siteName: 'ORBIT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ORBIT — Every person is a universe.',
    description: 'Create a planet that reflects who you are and share your world through one link.',
  },
};

export const viewport: Viewport = {
  themeColor: '#05060a',
  colorScheme: 'dark',
};

/** Always read fresh site settings (announcement) on each request */
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const lang = parseLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const settings = await loadSiteSettingsServer();

  return (
    <html lang={lang} dir={dir} className="dark">
      <body className={`${inter.variable} ${cairo.variable}`}>
        <LanguageProvider initialLang={lang}>
          <GlobalLanguageBar />
          <SiteAnnouncementBar
            show={settings.showAnnouncement}
            announcementEn={settings.announcementEn}
            announcementAr={settings.announcementAr}
          />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
