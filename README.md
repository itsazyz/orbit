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
| `/orbit-control` | Admin: stats, moderation (reports, bans, blocked words), users, planets, homepage CMS, site settings. |

### v2.1 features

* **3D planet** — `components/planet/Planet3D.tsx` renders a procedural WebGL
  shader (`lib/planet/shader.ts`): lit sphere, surface per style (bands,
  craters, oceans, crystal, lava, ice, storms, neon, metal…), clouds,
  atmosphere glow and a real 3D ring. No dependencies; pauses off-screen;
  falls back to the CSS planet without WebGL.
* **Warp intro** — `WarpIntro.tsx`, once per planet per session, skippable,
  off for reduced motion and for the owner.
* **Constellations** — stars sharing a category are joined by lines that read
  each star's live CSS animation progress, so they stay in sync.
* **Rich stars** — photo, gallery (up to 4), YouTube or Spotify per star
  (`lib/media.ts`, bucket `star-media`, images downscaled in the browser).
* **Guestbook** — visitors post through `submit_planet_message()` (rate
  limited per anonymous daily fingerprint, blocked words auto-hidden); owners
  approve/hide/delete from the dashboard.
* **Moderation** — visitor reports, admin bans (banned planets vanish from all
  public reads via RLS), and an admin-editable blocked-word list enforced by
  triggers.
* **Analytics** — `/api/track` adds country (Vercel edge header) and device,
  detects the source (`?s=` tag → in-app browser → referrer) and stores daily
  counters only (`planet_stats_daily`).

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
   then `0002_orbit_features.sql` in the SQL editor (or `supabase db push`).
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
