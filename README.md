# ORBIT — "Every person is a universe."

A visual personal identity page. Each person is a planet; the things that
shape them (passions, values, skills, what they're building) orbit around it
as stars. One link — `yourdomain.com/username` — shows the whole universe.

Bilingual (Arabic / English, full RTL), built on Next.js 14 + Supabase.

## What's in the app

| Route | What it does |
|---|---|
| `/` | Landing page with a live orbit demo, social proof, featured universes, FAQ. Copy is editable from the admin panel. |
| `/[username]` | Public planet. Server-rendered with per-user metadata and an auto-generated link-preview image (`opengraph-image.tsx`). Stars open a detail sheet with "Resonates with me". Viral "create yours" CTA for visitors; edit/share tools for the owner. |
| `/create` | 4-step wizard: identity (live username check) → planet design → stars (with prompts, edit, reorder) → links & music. Live preview, autosaved draft. |
| `/dashboard` | Visits (30-day chart), resonance, share kit (copy, WhatsApp, X, story image, QR), publish / Explore toggles, account deletion. |
| `/explore` | Gallery of public planets with search. |
| `/orbit-control` | Admin: stats, users, planets, homepage CMS, site settings (maintenance, announcement, sign-ups). |

## Architecture

* **Rendering.** Public pages are Server Components (fast first paint, SEO,
  real link previews). Interactive pieces are client components.
* **Orbit motion is pure CSS.** `components/universe/OrbitStage.tsx` lays stars
  out on up to three rings (`lib/universe/orbit-layout.ts`) and animates them
  with compositor-only transforms. Nothing re-renders per frame, and
  `prefers-reduced-motion` falls back to a static layout. The 600px stage
  scales to fit any screen.
* **Language.** First visit picks Arabic for Arabic browsers
  (`Accept-Language`, in middleware); the toggle overrides it via cookie.
* **Share images.** Link previews are rendered on the server (Latin text only,
  because the OG renderer can't shape Arabic). Story images are drawn in the
  browser with canvas, which handles Arabic correctly.

## Security model

* RLS on every table; the browser only ever has the anon key.
* **No service-role key.** Admin rights come from `private.admins`
  (checked by `public.is_admin()`), enforced by RLS policies and by the
  `SECURITY DEFINER` admin functions themselves.
* Counters (`planet_views_daily`, `stars.resonance_count`) can only change
  through `record_planet_view()` / `resonate_star()`; a trigger stops owners
  from editing their own resonance numbers.
* The sign-up switch is enforced in the `handle_new_user` trigger, not just
  in the UI.

## Setup

1. Create a Supabase project and run `supabase/migrations/0001_orbit_baseline.sql`
   in the SQL editor (or `supabase db push`).
2. Make yourself an admin:
   ```sql
   insert into private.admins (email) values ('you@example.com');
   ```
3. **Authentication → URL Configuration**: set *Site URL* to your production
   URL and add `https://<your-domain>/auth/callback` (and
   `http://localhost:3000/auth/callback`) to *Redirect URLs*.
4. Recommended: turn off **Confirm email** (Authentication → Providers → Email)
   for a no-friction sign-up, or configure custom SMTP — Supabase's built-in
   mailer is limited to a few emails per hour.
5. `cp .env.example .env.local`, fill in the two Supabase values, then:

```bash
npm install
npm run dev
```

## Deploying on Vercel

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for
Production and Preview. `vercel.json` pins functions to `fra1` (Frankfurt),
next to the `eu-central-1` database — keep them in the same region.

```bash
npm run typecheck   # tsc --noEmit
npm run build
```
