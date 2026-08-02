'use client';

import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/i18n/context';

interface CopyShareButtonsProps {
  url: string;
  className?: string;
}

export function CopyShareButtons({ url, className }: CopyShareButtonsProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback below */
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ORBIT', url });
        return;
      } catch {
        /* user cancelled or failed */
      }
    }
    await handleCopy();
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={handleCopy} aria-label={t('publish.copyLink')}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t('publish.copied') : t('publish.copyLink')}
        </Button>
        <Button variant="secondary" onClick={handleShare} aria-label={t('publish.share')}>
          <Share2 className="h-4 w-4" />
          {t('publish.share')}
        </Button>
      </div>
    </div>
  );
}
