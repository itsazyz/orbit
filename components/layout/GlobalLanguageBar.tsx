'use client';

import { LanguageSelector } from '@/components/ui/LanguageSelector';

/** Fixed language toggle — visible on every page */
export function GlobalLanguageBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center p-3 sm:pt-4">
      <div className="pointer-events-auto rounded-full border border-white/15 bg-[#05060a]/85 shadow-lg shadow-black/30 backdrop-blur-md">
        <LanguageSelector variant="toggle" />
      </div>
    </div>
  );
}
