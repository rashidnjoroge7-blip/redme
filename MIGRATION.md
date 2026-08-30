# RedNote Next.js Migration

## Status

Phase 2 is in progress on `main`. The legacy `index.html` remains in the repository as the feature reference and has not been deleted.

## Current stack

- Next.js 16.3.3
- React 19.2
- TypeScript
- Tailwind CSS 4.3
- `@supabase/ssr` 0.12.x
- `@supabase/supabase-js` 2.112.x
- Supabase Auth / PostgreSQL / Realtime / Storage
- ESLint

## Current architecture

```text
app/
  account/page.tsx             Protected server-rendered account
  auth/confirm/route.ts        Email confirmation exchange
  auth/signout/route.ts        Server-side sign out
  feed/page.tsx                Supabase-backed feed route
  login/page.tsx               Dedicated auth route
components/
  auth/AuthPanel.tsx           React/Supabase authentication UI
  feed/FeedShell.tsx           Legacy-compatible feed boundary
  feed/LiveFeedShell.tsx       Supabase-backed feed UI
lib/
  data/posts.ts                Typed server-side posts data access
  supabase/client.ts            Typed browser client
  supabase/server.ts            Typed server client
  supabase/proxy.ts             Typed session refresh implementation
proxy.ts                        Next.js request proxy
types/database.ts               Supabase database contract
supabase/migrations/0001_core_social.sql
                               Core social tables + RLS + counters
```

## Authentication architecture

The migration uses the Supabase SSR architecture with separate browser and server clients and a request proxy for session refresh.

Sessions are managed through the SSR client's cookie-based storage rather than a custom application token store. The server-side implementation uses `getClaims()` to verify authenticated access and `getUser()` when the current user record is required.

The browser client expects:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Never put a Supabase service-role/secret key in `NEXT_PUBLIC_*` variables or client components.

## Database milestone

The repository previously documented `supabase/schema.sql`, but that file was absent from the repository. A new additive migration now documents and establishes the core social model:

- `profiles`
- `posts`
- `comments`
- `likes`
- `saves`
- `follows`

The migration adds indexes, enables RLS, applies ownership-scoped mutation policies, and maintains denormalized `likes_count` and `comments_count` through database triggers.

**Important:** this migration is a source-of-truth candidate for a fresh/partially initialized project. Before applying it to an existing production Supabase project, compare the existing schema and reconcile any legacy column names such as `userid`/`user_id` and `postid`/`post_id`. Do not run migrations blindly against production data.

`types/database.ts` provides the matching TypeScript contract for the core tables. It should be replaced with generated Supabase types once the actual production schema has been confirmed.

## Current migration work

### Completed

- Next.js App Router foundation
- Tailwind CSS migration foundation
- Supabase typed browser/server clients
- Supabase SSR session refresh using Next.js `proxy.ts`
- Login and signup UI
- Protected `/account` route
- Server-side logout route
- Email confirmation callback route
- Server-side posts query
- Supabase-backed home and `/feed` routes
- Server-side category and search filtering
- Core social schema migration with RLS
- Typed database contract
- CI workflow for lint/build

### Remaining

1. Confirm the production Supabase schema and replace the provisional database contract with generated types.
2. Port post creation/editing and Supabase Storage image upload.
3. Port comments, likes, saves and follows using the new RLS policies.
4. Port profiles and settings.
5. Port notifications and Supabase Realtime subscriptions.
6. Port messaging and conversation authorization.
7. Port marketplace, cart and orders.
8. Add M-Pesa server-side integration through Next.js route handlers/server actions.
9. Port admin/moderation functionality with server-side authorization and RLS.
10. Replace remaining legacy CSS with reusable Tailwind components while preserving the current RedNote visual design.
11. Add automated unit/integration/e2e tests and production build validation.
12. Retire `index.html` after feature parity and production verification.

## Validation

GitHub Actions runs `npm install`, `npm run lint`, and `npm run build` on pushes and pull requests. The GitHub API currently shows no completed workflow runs for this repository, so a green CI build has not yet been independently verified. Run the same commands locally after pulling the latest `main`.
