'use client';

import { useCallback, useState } from 'react';
import { Check, Copy, Download, ImageIcon, Loader2, MessageCircle, QrCode, Share2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { renderStoryImage } from '@/lib/share/story-image';
import type { UniverseMood } from '@/types/database';
import { cn } from '@/lib/utils';

export interface SharePanelProps {
  url: string;
  username: string;
  displayName: string;
  bio: string | null;
  planetColor: string;
  hasRing: boolean;
  mood: UniverseMood;
  starTitles: string[];
  className?: string;
  onShared?: () => void;
}

const btn =
  'flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/85 transition hover:border-white/25 hover:bg-white/[0.08]';

export function SharePanel(props: SharePanelProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [storyBusy, setStoryBusy] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const { url, onShared } = props;
  const message = `${t('share.message')} ${url}`;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onShared?.();
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(t('share.copy'), url);
    }
  }, [url, onShared, t]);

  const nativeShare = useCallback(async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: `${props.displayName} — ORBIT`, text: t('share.message'), url });
      onShared?.();
    } catch {
      /* cancelled */
    }
  }, [copy, onShared, props.displayName, t, url]);

  const story = useCallback(async () => {
    setStoryBusy(true);
    try {
      const blob = await renderStoryImage({
        displayName: props.displayName,
        username: props.username,
        bio: props.bio,
        planetColor: props.planetColor,
        hasRing: props.hasRing,
        mood: props.mood,
        starTitles: props.starTitles,
        url,
        ctaLine: t('planet.ctaTitle'),
      });
      const file = new File([blob], `orbit-${props.username}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'ORBIT', text: url });
      } else {
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = file.name;
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(href), 4000);
      }
      onShared?.();
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') console.error('[share] story failed:', error);
    } finally {
      setStoryBusy(false);
    }
  }, [onShared, props, t, url]);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=16&data=${encodeURIComponent(url)}`;

  return (
    <div className={cn('space-y-4', props.className)}>
      <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-black/30 p-1.5 ps-4">
        <span className="min-w-0 flex-1 truncate text-sm text-white/80" dir="ltr">
          {url.replace(/^https?:\/\//, '')}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-white/90"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? t('share.copied') : t('share.copy')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button type="button" onClick={nativeShare} className={btn}>
          <Share2 size={16} /> {t('share.native')}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onShared?.()}
          className={btn}
        >
          <MessageCircle size={16} className="text-[#25d366]" /> {t('share.whatsapp')}
        </a>
        <a
          href={`https://x.com/intent/post?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onShared?.()}
          className={btn}
        >
          <span className="font-bold">𝕏</span> {t('share.x')}
        </a>
        <button type="button" onClick={() => setShowQr((v) => !v)} className={btn}>
          <QrCode size={16} /> {t('share.qr')}
        </button>
      </div>

      <button
        type="button"
        onClick={story}
        disabled={storyBusy}
        className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.07] to-white/[0.02] p-4 text-start transition hover:border-white/25 disabled:opacity-60"
      >
        <span
          className="flex h-12 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `linear-gradient(180deg, ${props.planetColor}, #0b0d18)` }}
        >
          {storyBusy ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-white">
            {storyBusy ? t('share.storyGenerating') : t('share.story')}
          </span>
          <span className="block text-xs text-white/50">{t('share.storyHint')}</span>
        </span>
      </button>

      {showQr ? (
        <div className="animate-sheet-up flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR" width={200} height={200} className="rounded-xl bg-white p-2" />
          <p className="max-w-xs text-xs text-white/55">{t('share.qrHint')}</p>
          <a
            href={qrSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
          >
            <Download size={15} /> {t('share.qrDownload')}
          </a>
        </div>
      ) : null}
    </div>
  );
}
