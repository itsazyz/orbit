interface SiteAnnouncementBarProps {
  text: string;
}

/** Fixed banner under the language switcher — visible on every page */
export function SiteAnnouncementBar({ text }: SiteAnnouncementBarProps) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[3.35rem] z-[99] flex justify-center px-3 sm:top-16">
      <div className="pointer-events-auto max-w-3xl rounded-full border border-amber-400/25 bg-[#1a1408]/92 px-4 py-2 text-center text-sm text-amber-50 shadow-lg shadow-black/40 backdrop-blur-md">
        {trimmed}
      </div>
    </div>
  );
}
