import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/create', '/orbit-control', '/auth/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
