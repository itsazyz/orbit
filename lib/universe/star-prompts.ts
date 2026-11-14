export interface StarPrompt {
  category: string;
  icon: string;
  en: string;
  ar: string;
}

/** Question prompts that beat the blank-page problem in the star step. */
export const STAR_PROMPTS: StarPrompt[] = [
  { category: 'passion', icon: '♡', en: 'Something I could talk about for hours', ar: 'شيء أتكلم عنه لساعات' },
  { category: 'building', icon: '◉', en: "What I'm building right now", ar: 'ما أبنيه الآن' },
  { category: 'value', icon: '★', en: "A value I won't compromise on", ar: 'قيمة لا أتنازل عنها' },
  { category: 'learning', icon: '☼', en: "What I'm learning these days", ar: 'ما أتعلمه هذه الأيام' },
  { category: 'dream', icon: '☾', en: "A dream I'm chasing", ar: 'حلم أطارده' },
  { category: 'favorite', icon: '♪', en: 'A song, book or film that shaped me', ar: 'أغنية أو كتاب أو فيلم شكّلني' },
  { category: 'skill', icon: '✦', en: "Something I'm genuinely good at", ar: 'شيء أتقنه فعلاً' },
  { category: 'memory', icon: '✈', en: 'A place that feels like home', ar: 'مكان أشعر فيه أنني في بيتي' },
  { category: 'goal', icon: '⚑', en: 'A goal for this year', ar: 'هدف لهذه السنة' },
  { category: 'idea', icon: '⚡', en: "An idea I can't stop thinking about", ar: 'فكرة لا تفارق رأسي' },
];

export const STAR_CATEGORIES = [
  'passion',
  'building',
  'value',
  'learning',
  'dream',
  'favorite',
  'skill',
  'memory',
  'goal',
  'idea',
] as const;

export const STAR_ICONS = ['✦', '★', '♡', '♪', '☼', '☾', '✈', '◉', '⚡', '⚑', '☕', '⚽', '✎', '♛', '☘', '⚓'];
