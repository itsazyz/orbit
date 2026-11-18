'use client';

import { useMemo } from 'react';
import { SpaceBackdrop } from '@/components/universe/SpaceBackdrop';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { OrbitStage } from '@/components/universe/OrbitStage';
import { LinkIcon } from '@/components/links/LinkIcon';
import { getLinkMeta } from '@/lib/links';
import { lookFromEditor, type EditorState } from '@/lib/profile/client';
import { cn } from '@/lib/utils';

interface PlanetPreviewProps {
  state: EditorState;
  emptyName: string;
  emptyBio: string;
  className?: string;
}

/** Mirror of the public page, used live while editing. */
export function PlanetPreview({ state, emptyName, emptyBio, className }: PlanetPreviewProps) {
  const look = useMemo(() => lookFromEditor(state), [state]);
  return (
    <div className={cn('relative flex flex-col overflow-hidden rounded-[28px] border border-white/10', className)}>
      <div className="absolute inset-0">
        <SpaceBackdrop
          background={look.spaceBackground}
          mood={look.mood}
          color={look.color}
          color2={look.color2}
          seed={look.seed}
        />
        <StarsBackground seed={look.seed} count={40} />
      </div>
      <div className="relative min-h-0 flex-1">
        <OrbitStage
          planet={look}
          stars={state.stars.map((s) => ({
            id: s.id,
            title: s.title,
            icon: s.icon,
            visualType: s.visualType,
            category: s.category,
          }))}
          labelMinScale={0.7}
          render3d
        />
      </div>
      <div className="relative px-6 pb-6 text-center">
        <p className="text-xl font-semibold text-white">{state.displayName.trim() || emptyName}</p>
        <p className="mt-0.5 text-xs" style={{ color: state.planetColor }} dir="ltr">
          @{state.username || 'you'}
        </p>
        <p className="mx-auto mt-2 line-clamp-2 max-w-xs text-sm text-white/65">
          {state.bio.trim() || emptyBio}
        </p>
        {state.links.length ? (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {state.links.map((link, i) => (
              <span
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5"
                style={{ color: getLinkMeta(link.type).color }}
              >
                <LinkIcon type={link.type} size={14} />
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
