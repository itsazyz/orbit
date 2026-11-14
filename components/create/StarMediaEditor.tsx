'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Music2, Trash2, Youtube } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/context';
import { MAX_GALLERY_IMAGES, mediaImages, parseSpotify, parseYouTubeId, uploadStarImage } from '@/lib/media';
import type { StarMedia } from '@/types/database';
import { cn } from '@/lib/utils';

type Mode = 'none' | 'image' | 'youtube' | 'spotify';

interface StarMediaEditorProps {
  userId: string;
  starId: string;
  value: StarMedia | null;
  onChange: (media: StarMedia | null) => void;
}

function modeOf(media: StarMedia | null): Mode {
  if (!media) return 'none';
  if (media.type === 'image' || media.type === 'gallery') return 'image';
  return media.type;
}

function storagePath(url: string): string | null {
  const marker = '/storage/v1/object/public/star-media/';
  const i = url.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
}

/** Attach an image / gallery (up to 4), a YouTube video or a Spotify embed to a star. */
export function StarMediaEditor({ userId, starId, value, onChange }: StarMediaEditorProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>(modeOf(value));
  const [linkInput, setLinkInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const images = mediaImages(value);

  function setImages(urls: string[]) {
    if (!urls.length) onChange(null);
    else if (urls.length === 1) onChange({ type: 'image', url: urls[0]! });
    else onChange({ type: 'gallery', urls });
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    setUploading(true);
    const supabase = createClient();
    const next = [...images];
    try {
      for (const file of Array.from(files).slice(0, MAX_GALLERY_IMAGES - next.length)) {
        next.push(await uploadStarImage(supabase, userId, starId, file));
      }
      setImages(next);
    } catch (err) {
      setError((err as Error).message === 'TOO_LARGE' ? t('wizard.mediaTooLarge') : t('wizard.mediaUploadFailed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function removeImage(url: string) {
    setImages(images.filter((u) => u !== url));
    const path = storagePath(url);
    if (path) await createClient().storage.from('star-media').remove([path]);
  }

  function applyLink() {
    setError('');
    if (mode === 'youtube') {
      const id = parseYouTubeId(linkInput);
      if (!id) return setError(t('wizard.mediaInvalid'));
      onChange({ type: 'youtube', id });
    } else if (mode === 'spotify') {
      const parsed = parseSpotify(linkInput);
      if (!parsed) return setError(t('wizard.mediaInvalid'));
      onChange({ type: 'spotify', kind: parsed.kind, id: parsed.id });
    }
    setLinkInput('');
  }

  function switchMode(next: Mode) {
    setError('');
    setMode(next);
    if (next === 'none') onChange(null);
    else if (modeOf(value) !== next && value) onChange(null);
  }

  const tabs: Array<{ id: Mode; label: string }> = [
    { id: 'none', label: t('wizard.mediaNone') },
    { id: 'image', label: t('wizard.mediaImage') },
    { id: 'youtube', label: 'YouTube' },
    { id: 'spotify', label: 'Spotify' },
  ];

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-white/85">{t('wizard.media')}</span>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchMode(tab.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition',
              mode === tab.id ? 'border-white bg-white text-black' : 'border-white/12 text-white/70 hover:border-white/30'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'image' ? (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {images.map((url) => (
              <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute end-1 top-1 rounded-full bg-black/70 p-1 text-white/80 hover:text-white"
                  aria-label={t('wizard.remove')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {images.length < MAX_GALLERY_IMAGES ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 text-[11px] text-white/55 hover:border-white/40 hover:text-white"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                {uploading ? t('wizard.mediaUploading') : t('wizard.mediaUpload')}
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] text-white/40">{t('wizard.mediaImageHint')}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : null}

      {mode === 'youtube' || mode === 'spotify' ? (
        <div className="mt-3 space-y-2">
          {value && (value.type === 'youtube' || value.type === 'spotify') ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
              {value.type === 'youtube' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`https://i.ytimg.com/vi/${value.id}/mqdefault.jpg`} alt="" className="h-12 w-20 rounded-lg object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1db954]/20 text-[#1db954]">
                  <Music2 size={18} />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-xs text-white/70" dir="ltr">
                {value.type === 'youtube' ? `youtube.com/watch?v=${value.id}` : `spotify ${value.kind} · ${value.id}`}
              </span>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                aria-label={t('wizard.remove')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : null}
          <div className="flex gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3">
              {mode === 'youtube' ? <Youtube size={16} className="shrink-0 text-[#ff4e45]" /> : <Music2 size={16} className="shrink-0 text-[#1db954]" />}
              <input
                dir="ltr"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyLink();
                  }
                }}
                placeholder={mode === 'youtube' ? 'https://youtu.be/…' : 'https://open.spotify.com/track/…'}
                className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>
            <button
              type="button"
              onClick={applyLink}
              className="shrink-0 rounded-xl bg-white px-4 text-sm font-medium text-black hover:bg-white/90"
            >
              {t('wizard.mediaAttach')}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
