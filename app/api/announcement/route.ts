import { NextResponse } from 'next/server';
import { loadSiteSettingsServer } from '@/lib/site-config/load';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Public announcement payload for the site-wide banner */
export async function GET() {
  try {
    const settings = await loadSiteSettingsServer();
    return NextResponse.json(
      {
        show: Boolean(settings.showAnnouncement),
        en: settings.announcementEn ?? '',
        ar: settings.announcementAr ?? '',
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('[api/announcement]', error);
    return NextResponse.json(
      { show: false, en: '', ar: '', error: 'load_failed' },
      { status: 200 }
    );
  }
}
