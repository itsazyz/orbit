'use client';

import { useRef, useState } from 'react';
import type { StarMedia } from '@/types/database';
import { spotifyEmbedUrl, youtubeEmbedUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

/** Renders a star's image, gallery, YouTube video or Spotify player. */
export function StarMediaView({ media, title }: { media: StarMedia; title: string }) {
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  if (media.type === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.url}
        alt={title}
        loading="lazy"
        className="max-h-[42svh] w-full rounded-2xl bg-black/30 object-contain"
      />
    );
  }

  if (media.type === 'gallery') {
    return (
      <div className="relative">
        <div
          ref={scroller}
          className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-2xl"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(Math.abs(el.scrollLeft) / Math.max(1, el.clientWidth)));
          }}
        >
          {media.urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={`${title} ${i + 1}`}
              loading="lazy"
              className="max-h-[42svh] w-full shrink-0 snap-center rounded-2xl bg-black/30 object-contain"
            />
          ))}
        </div>
        {media.urls.length > 1 ? (
          <div className="mt-2 flex justify-center gap-1.5">
            {media.urls.map((url, i) => (
              <button
                key={url}
                type="button"
                aria-label={`${i + 1}`}
                onClick={() => {
                  const el = scroller.current;
                  if (!el) return;
                  const dir = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
                  el.scrollTo({ left: dir * i * el.clientWidth, behavior: 'smooth' });
                }}
                className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/35')}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (media.type === 'youtube') {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={youtubeEmbedUrl(media.id)}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <iframe
      src={spotifyEmbedUrl(media.kind, media.id)}
      title={title}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      className="w-full rounded-2xl"
      style={{ height: media.kind === 'track' || media.kind === 'episode' ? 152 : 352 }}
    />
  );
}
