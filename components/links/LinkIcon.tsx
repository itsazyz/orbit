import {
  Dribbble,
  Ghost,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Music2,
  Palette,
  Send,
  Youtube,
  type LucideProps,
} from 'lucide-react';
import type { LinkType } from '@/types/database';

function XGlyph(props: LucideProps) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={props.className}
    >
      <path d="M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.34l4.37 5.78L17.75 3Zm-1.08 16.17h1.7L7.43 4.74H5.6l11.07 14.43Z" />
    </svg>
  );
}

const ICONS: Record<LinkType, (props: LucideProps) => JSX.Element> = {
  instagram: (p) => <Instagram {...p} />,
  x: (p) => <XGlyph {...p} />,
  tiktok: (p) => <Music2 {...p} />,
  snapchat: (p) => <Ghost {...p} />,
  youtube: (p) => <Youtube {...p} />,
  linkedin: (p) => <Linkedin {...p} />,
  github: (p) => <Github {...p} />,
  behance: (p) => <Palette {...p} />,
  dribbble: (p) => <Dribbble {...p} />,
  whatsapp: (p) => <MessageCircle {...p} />,
  telegram: (p) => <Send {...p} />,
  email: (p) => <Mail {...p} />,
  website: (p) => <Globe {...p} />,
};

export function LinkIcon({ type, ...props }: { type: LinkType } & LucideProps) {
  const Icon = ICONS[type] ?? ICONS.website;
  return <Icon size={18} strokeWidth={1.8} aria-hidden {...props} />;
}
