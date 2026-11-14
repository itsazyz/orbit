import type { LinkType, ProfileLink } from '@/types/database';

export interface LinkTypeMeta {
  type: LinkType;
  label: string;
  /** Placeholder shown in the editor */
  placeholder: string;
  /** Prefix used when the user types a bare handle instead of a URL */
  handlePrefix?: string;
  color: string;
}

export const LINK_TYPES: LinkTypeMeta[] = [
  { type: 'instagram', label: 'Instagram', placeholder: '@username', handlePrefix: 'https://instagram.com/', color: '#e1306c' },
  { type: 'x', label: 'X', placeholder: '@username', handlePrefix: 'https://x.com/', color: '#e7e9ea' },
  { type: 'tiktok', label: 'TikTok', placeholder: '@username', handlePrefix: 'https://www.tiktok.com/@', color: '#25f4ee' },
  { type: 'snapchat', label: 'Snapchat', placeholder: 'username', handlePrefix: 'https://snapchat.com/add/', color: '#fffc00' },
  { type: 'youtube', label: 'YouTube', placeholder: '@channel', handlePrefix: 'https://youtube.com/@', color: '#ff4e45' },
  { type: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/you', handlePrefix: 'https://www.linkedin.com/in/', color: '#4ea1f5' },
  { type: 'github', label: 'GitHub', placeholder: 'username', handlePrefix: 'https://github.com/', color: '#f0f6fc' },
  { type: 'behance', label: 'Behance', placeholder: 'username', handlePrefix: 'https://www.behance.net/', color: '#4f7cff' },
  { type: 'dribbble', label: 'Dribbble', placeholder: 'username', handlePrefix: 'https://dribbble.com/', color: '#ea4c89' },
  { type: 'whatsapp', label: 'WhatsApp', placeholder: '9665XXXXXXXX', handlePrefix: 'https://wa.me/', color: '#25d366' },
  { type: 'telegram', label: 'Telegram', placeholder: '@username', handlePrefix: 'https://t.me/', color: '#29a9eb' },
  { type: 'email', label: 'Email', placeholder: 'you@example.com', color: '#c4b5fd' },
  { type: 'website', label: 'Website', placeholder: 'https://your.site', color: '#a5b4fc' },
];

const META_BY_TYPE = new Map(LINK_TYPES.map((m) => [m.type, m]));

export function getLinkMeta(type: string): LinkTypeMeta {
  return META_BY_TYPE.get(type as LinkType) ?? META_BY_TYPE.get('website')!;
}

export const MAX_LINKS = 8;

/**
 * Turn whatever the user typed (a handle, a bare domain, a full URL, a phone
 * number) into a safe absolute URL, or null when it cannot be one.
 */
export function normalizeLinkUrl(type: LinkType, raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (type === 'email') {
    const email = value.replace(/^mailto:/i, '');
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
  }

  if (type === 'whatsapp') {
    if (/^https?:\/\//i.test(value)) return safeHttpUrl(value);
    const digits = value.replace(/[^\d]/g, '');
    return digits.length >= 8 ? `https://wa.me/${digits}` : null;
  }

  if (/^https?:\/\//i.test(value)) return safeHttpUrl(value);

  // Looks like a domain (contains a dot and no spaces) → assume https.
  if (/^[^\s@]+\.[^\s]{2,}/.test(value) && !value.startsWith('@')) {
    return safeHttpUrl(`https://${value}`);
  }

  const meta = getLinkMeta(type);
  if (meta.handlePrefix) {
    const handle = value.replace(/^@/, '').replace(/[^\w.\-]/g, '');
    return handle ? safeHttpUrl(`${meta.handlePrefix}${handle}`) : null;
  }

  return null;
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Short human label for a link, e.g. "@aziz" or "aziz.dev" */
export function linkDisplayText(link: ProfileLink): string {
  if (link.type === 'email') return link.url.replace(/^mailto:/i, '');
  try {
    const url = new URL(link.url);
    const path = url.pathname.replace(/\/+$/, '');
    if (link.type === 'website') return url.host.replace(/^www\./, '') + (path && path !== '/' ? path : '');
    const last = path.split('/').filter(Boolean).pop();
    if (!last) return url.host.replace(/^www\./, '');
    if (link.type === 'whatsapp') return `+${last}`;
    return last.startsWith('@') ? last : `@${last}`;
  } catch {
    return link.url;
  }
}

/** Defensive parse of the jsonb column (it is user-writable). */
export function parseProfileLinks(value: unknown): ProfileLink[] {
  if (!Array.isArray(value)) return [];
  const out: ProfileLink[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const { type, url } = item as { type?: unknown; url?: unknown };
    if (typeof type !== 'string' || typeof url !== 'string') continue;
    if (!META_BY_TYPE.has(type as LinkType)) continue;
    if (!/^(https?:\/\/|mailto:)/i.test(url)) continue;
    out.push({ type: type as LinkType, url });
    if (out.length >= MAX_LINKS) break;
  }
  return out;
}
