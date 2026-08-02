import type { Metadata } from 'next';
import { Inter, Noto_Sans_Arabic } from 'next/font/google';
import { cookies } from 'next/headers';
import { LanguageProvider } from '@/lib/i18n/context';
import { LANGUAGE_COOKIE, parseLanguage } from '@/lib/i18n';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ORBIT — Every person is a universe.',
  description:
    'Create a visual personal universe. Share one link that expresses who you are.',
  openGraph: {
    title: 'ORBIT',
    description: 'Every person is a universe.',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const lang = parseLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} className="dark">
      <body className={`${inter.variable} ${notoArabic.variable}`}>
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
