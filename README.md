# ORBIT — "Every person is a universe."

A visual personal identity platform. Not a social network: create a planet,
add what orbits it, publish, share one link.

## Build status

This project is being delivered in ordered parts (per your preference for
building in full sequential passes rather than compressed demos):

- [x] **Part 1 — Architecture, project scaffold, database, RLS** (this part)
- [ ] Part 2 — i18n (ar/en, RTL), auth (sign up/in/out, reset), route protection
- [ ] Part 3 — Landing page (bilingual, cinematic hero)
- [ ] Part 4 — Planet creation flow (4 steps) + validation (Zod)
- [ ] Part 5 — SVG universe renderer (deterministic layout, drag, zoom, pan) + customization
- [ ] Part 6 — Public `/[username]` page, dashboard, settings, empty/error states
- [ ] Part 7 — Accessibility pass, tests, lint/build instructions, deployment

## Architecture decisions

**Rendering split.** The public `/[username]` page and the landing page are
Server Components by default (fast first paint, SEO-friendly, no client JS
needed just to fetch the universe). The interactive SVG canvas itself
(`components/universe/UniverseCanvas.tsx`, built in Part 5) is a Client
Component boundary — pan/zoom/drag state has to live in the browser, but the
data fetch that feeds it happens on the server first.

**Data shape.** `public.public_universes` is a Postgres view that joins
`profiles` + `universe_objects` into one row with objects pre-aggregated as
JSON (see migration `0001_init.sql`). The public page does one query, not
N+1. The view uses `security_invoker = true`, so it still obeys RLS as the
querying user — it's a convenience shape, not a privilege bypass.

**Security model.** RLS is the source of truth, not a frontend gate:
- Every table has RLS enabled with explicit `select/insert/update/delete`
  policies scoped to `auth.uid()`.
- Public reads require both `is_published = true` AND `visibility = 'public'`
  — a private-but-published edge case can never leak.
- The service role key (`lib/supabase/server.ts::createServiceRoleClient`)
  is isolated in one function, guarded against browser execution, and is
  only meant for privileged server-only operations like hard account
  deletion. Normal reads/writes always go through the RLS-scoped client.

**Deterministic layout.** `position_x`/`position_y`/`orbit_radius` are
columns, not computed client-side on every render. A profile's objects get
a seeded layout (seed = `profile_id`) the first time they're arranged, then
persisted — so a visitor's browser and the owner's editor always agree on
where things are, and refreshing never reshuffles the universe. The seeding
algorithm lives in `lib/universe/layout.ts` (Part 5).

**Max 20 objects** is enforced twice: in the creation-flow UI (so the user
never even sees an error) and in a `before insert` trigger on
`universe_objects` (so the limit holds even if someone calls the API
directly, bypassing the UI).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```

## Supabase setup

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql` (or, if you
   use the Supabase CLI: `supabase link` then `supabase db push`).
3. Copy **Project Settings → API** into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — do not expose)
4. In **Authentication → URL Configuration**, set your site URL and add
   `http://localhost:3000/auth/callback` as a redirect URL for local dev.
5. Email confirmations: enabled by default in Supabase Auth. You can
   customize the templates under **Authentication → Email Templates**.

## Verifying the build (do this on your machine — see note below)

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

> **Note on how this was built:** I wrote every file in this repo directly
> (no scaffolding CLI), including the full SQL migration, RLS policies, and
> the SSR-aware Supabase client setup. I do not have network access in this
> environment, so I could not run `npm install` / `npm run build` here to
> self-verify compilation — please run the commands above once you pull
> this down. If anything fails to typecheck or build, send me the exact
> error output and I'll fix it directly.

## Project structure

```
app/
  [username]/        public universe page  (Part 6)
  auth/               sign-in/up, callback, reset (Part 2)
  create/             4-step creation flow  (Part 4)
  dashboard/          owner dashboard       (Part 6)
  settings/           account settings      (Part 6)
components/
  universe/           SVG canvas, object nodes, orbit math (Part 5)
  planet/             planet renderer + customization (Part 5)
  creation/           step-by-step form components (Part 4)
  ui/                 shared primitives (buttons, inputs, sheets)
lib/
  supabase/           client.ts, server.ts, middleware.ts  ✅ done
  universe/           layout seeding, style-suggestion mapping (Part 5)
  i18n/               dictionaries + RTL logic (Part 2)
hooks/                shared client hooks
types/
  database.ts         mirrors the SQL schema                ✅ done
messages/
  en.json, ar.json    translation strings (Part 2)
supabase/
  migrations/0001_init.sql   schema + RLS + triggers         ✅ done
```
