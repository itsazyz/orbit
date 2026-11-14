import { MOOD_PRESETS } from '@/lib/universe/constants';
import type { UniverseMood } from '@/types/database';

export interface StoryImageInput {
  displayName: string;
  username: string;
  bio: string | null;
  planetColor: string;
  hasRing: boolean;
  mood: UniverseMood;
  starTitles: string[];
  url: string;
  ctaLine: string;
}

const W = 1080;
const H = 1920;

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ARABIC = /[؀-ۿ]/;

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    lines[maxLines - 1] = `${lines[maxLines - 1]!.replace(/\s+\S*$/, '')}…`;
  }
  return lines;
}

/**
 * Draws a 1080×1920 story card of the planet in the browser (canvas shapes
 * Arabic text natively, which server-side image renderers cannot).
 */
export async function renderStoryImage(input: StoryImageInput): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  try {
    await document.fonts?.ready;
  } catch {
    /* ignore */
  }
  const family = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  const mood = MOOD_PRESETS[input.mood] ?? MOOD_PRESETS.calm;
  const color = input.planetColor;
  const rand = seeded(input.username);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, mood.bg);
  bg.addColorStop(0.55, '#06070d');
  bg.addColorStop(1, '#030409');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const wash = ctx.createRadialGradient(W / 2, 720, 40, W / 2, 720, 900);
  wash.addColorStop(0, `${color}55`);
  wash.addColorStop(1, 'transparent');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 220; i += 1) {
    ctx.globalAlpha = 0.15 + rand() * 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rand() * W, rand() * H, rand() * 2.2 + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const cx = W / 2;
  const cy = 720;
  const R = 200;

  // Orbit rings
  ctx.setLineDash([6, 10]);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  for (const r of [330, 430]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Back half of the planetary ring
  const drawRing = (front: boolean) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((-22 * Math.PI) / 180);
    ctx.strokeStyle = color;
    ctx.lineWidth = 9;
    ctx.globalAlpha = front ? 0.95 : 0.45;
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 1.85, R * 0.42, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };
  if (input.hasRing) drawRing(false);

  // Planet body
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 120;
  const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(0.35, color);
  body.addColorStop(0.75, color);
  body.addColorStop(1, '#0b0614');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (input.hasRing) drawRing(true);

  // Orbiting stars
  const count = Math.max(6, Math.min(14, input.starTitles.length || 8));
  for (let i = 0; i < count; i += 1) {
    const ring = i % 2 === 0 ? 330 : 430;
    const a = (i / count) * Math.PI * 2 + (ring === 430 ? 0.35 : 0);
    const x = cx + Math.cos(a) * ring;
    const y = cy + Math.sin(a) * ring;
    ctx.save();
    ctx.shadowColor = i % 3 === 0 ? color : '#ffffff';
    ctx.shadowBlur = 28;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Text block
  const name = input.displayName || input.username;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.direction = ARABIC.test(name) ? 'rtl' : 'ltr';
  ctx.font = `700 88px ${family}`;
  ctx.fillText(name, cx, 1290, W - 140);

  ctx.direction = 'ltr';
  ctx.font = `500 40px ${family}`;
  ctx.fillStyle = color;
  ctx.fillText(`@${input.username}`, cx, 1355);

  let y = 1440;
  if (input.bio) {
    ctx.direction = ARABIC.test(input.bio) ? 'rtl' : 'ltr';
    ctx.font = `400 38px ${family}`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (const line of wrapLines(ctx, input.bio, W - 200, 3)) {
      ctx.fillText(line, cx, y);
      y += 54;
    }
    y += 20;
  }

  // Star chips (centered rows)
  const chips = input.starTitles.slice(0, 6);
  if (chips.length) {
    ctx.font = `500 32px ${family}`;
    const padX = 28;
    const h = 64;
    const gap = 16;
    const rows: string[][] = [[]];
    let rowWidth = 0;
    for (const title of chips) {
      const label = title.length > 24 ? `${title.slice(0, 23)}…` : title;
      const w = ctx.measureText(label).width + padX * 2;
      if (rowWidth + w > W - 160 && rows[rows.length - 1]!.length) {
        rows.push([]);
        rowWidth = 0;
      }
      rows[rows.length - 1]!.push(label);
      rowWidth += w + gap;
      if (rows.length > 2) break;
    }
    for (const row of rows.slice(0, 2)) {
      const widths = row.map((l) => ctx.measureText(l).width + padX * 2);
      const total = widths.reduce((a, b) => a + b, 0) + gap * (row.length - 1);
      let x = cx - total / 2;
      row.forEach((labelText, i) => {
        const w = widths[i]!;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y - 44, w, h, 32);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.direction = ARABIC.test(labelText) ? 'rtl' : 'ltr';
        ctx.fillText(labelText, x + w / 2, y);
        x += w + gap;
      });
      y += h + gap;
    }
  }

  // Link pill at the bottom (sticker-friendly)
  ctx.direction = 'ltr';
  ctx.font = `600 42px ${family}`;
  const urlText = input.url.replace(/^https?:\/\//, '');
  const pillW = Math.min(W - 120, ctx.measureText(urlText).width + 96);
  const pillY = H - 250;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(cx - pillW / 2, pillY, pillW, 96, 48);
  ctx.fill();
  ctx.fillStyle = '#05060a';
  ctx.fillText(urlText, cx, pillY + 62);

  ctx.font = `400 30px ${family}`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.direction = ARABIC.test(input.ctaLine) ? 'rtl' : 'ltr';
  ctx.fillText(input.ctaLine, cx, H - 90);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))), 'image/png');
  });
}
