import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const EVENTS = new Set(['view', 'star_open', 'link_click', 'share']);
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp\/|telegrambot|preview|headless/i;

const SOURCE_ALIASES: Record<string, string> = {
  ig: 'instagram',
  insta: 'instagram',
  instagram: 'instagram',
  wa: 'whatsapp',
  whatsapp: 'whatsapp',
  x: 'x',
  tw: 'x',
  twitter: 'x',
  tt: 'tiktok',
  tiktok: 'tiktok',
  sc: 'snapchat',
  snap: 'snapchat',
  snapchat: 'snapchat',
  tg: 'telegram',
  telegram: 'telegram',
  li: 'linkedin',
  linkedin: 'linkedin',
  fb: 'facebook',
  facebook: 'facebook',
  qr: 'qr',
  story: 'story',
  yt: 'youtube',
  youtube: 'youtube',
};

function hostOf(ref: string): string {
  try {
    return new URL(ref).hostname.replace(/^www\.|^m\.|^l\./, '');
  } catch {
    return '';
  }
}

/** Where did this visit come from? Explicit ?s= tag > in-app browser > referrer. */
function detectSource(tag: unknown, ref: unknown, ua: string, ownHost: string): string {
  if (typeof tag === 'string' && SOURCE_ALIASES[tag.toLowerCase()]) return SOURCE_ALIASES[tag.toLowerCase()]!;
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/Snapchat/i.test(ua)) return 'snapchat';
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return 'tiktok';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook';
  if (/LinkedInApp/i.test(ua)) return 'linkedin';
  if (/Twitter/i.test(ua)) return 'x';

  const host = typeof ref === 'string' ? hostOf(ref) : '';
  if (!host) return 'direct';
  if (host === ownHost) return 'orbit';
  if (/instagram\.com$/.test(host)) return 'instagram';
  if (/(^|\.)t\.co$|twitter\.com$|(^|\.)x\.com$/.test(host)) return 'x';
  if (/whatsapp\.com$|(^|\.)wa\.me$/.test(host)) return 'whatsapp';
  if (/tiktok\.com$/.test(host)) return 'tiktok';
  if (/snapchat\.com$/.test(host)) return 'snapchat';
  if (/(^|\.)t\.me$|telegram\.(org|me)$/.test(host)) return 'telegram';
  if (/linkedin\.com$|lnkd\.in$/.test(host)) return 'linkedin';
  if (/facebook\.com$|fb\.me$/.test(host)) return 'facebook';
  if (/youtube\.com$|youtu\.be$/.test(host)) return 'youtube';
  if (/(^|\.)google\./.test(host)) return 'google';
  return 'other';
}

function detectDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Privacy-friendly analytics: the browser posts an event, the server adds
 * country (from Vercel's edge header) and device class, and Postgres stores
 * only daily counters. Runs as the visitor's session, so owners' own visits
 * are ignored inside track_planet_event().
 */
export async function POST(request: Request) {
  const ua = request.headers.get('user-agent') ?? '';
  if (BOT.test(ua)) return new NextResponse(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.toLowerCase() : '';
  const event = typeof body.event === 'string' ? body.event : '';
  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(username) || !EVENTS.has(event)) {
    return new NextResponse(null, { status: 400 });
  }
  const dim = typeof body.dim === 'string' ? body.dim.slice(0, 600) : null;
  const ownHost = (() => {
    try {
      return new URL(request.url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  })();

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('track_planet_event', {
      p_username: username,
      p_event: event,
      p_dim: dim,
      p_source: event === 'view' ? detectSource(body.s, body.ref, ua, ownHost) : null,
      p_country: event === 'view' ? request.headers.get('x-vercel-ip-country') : null,
      p_device: event === 'view' ? detectDevice(ua) : null,
    });
    if (error) console.error('[track] rpc failed:', error.message);
  } catch (error) {
    console.error('[track] failed:', error);
  }

  return new NextResponse(null, { status: 204 });
}
