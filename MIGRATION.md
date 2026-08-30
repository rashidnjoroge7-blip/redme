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
  data/posts.ts                Server-side posts data access
  supabase/client.ts            Browser client
  supabase/server.ts            Server client
  supabase/proxy.ts             Session refresh implementation
proxy.ts                        Next.js request proxy
```

## Authentication architecture

The migration now uses the Supabase SSR architecture with separate browser and server clients and a request proxy for session refresh.

Sessions are managed through the SSR client's cookie-based storage rather than a custom application token store. The server-side implementation uses `getClaims()` to verify authenticated access and `getUser()` when the current user record is required.

The browser client expects:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Never put a Supabase service-role/secret key in `NEXT_PUBLIC_*` variables or client components.

## Current migration work

### Completed

- Next.js App Router foundation
- Tailwind CSS migration foundation
- Supabase browser/server clients
- Supabase SSR session refresh using Next.js `proxy.ts`
- Login and signup UI
- Protected `/account` route
- Server-side logout route
- Email confirmation callback route
- Server-side posts query
- Supabase-backed `/feed` route
- Interactive category filtering on the migrated feed
- CI workflow for lint/build
- Current Supabase packages updated to the current npm releases used by this migration

### Remaining

1. Port post creation/editing and image upload.
2. Port comments, likes, saves and follows.
3. Port profiles and settings.
4. Port notifications and Supabase Realtime subscriptions.
5. Port messaging and conversation authorization.
6. Port marketplace, cart and orders.
7. Add M-Pesa server-side integration through Next.js route handlers/server actions.
8. Port admin/moderation functionality with server-side authorization and RLS.
9. Replace remaining legacy CSS with reusable Tailwind components while preserving the current RedNote visual design.
10. Add automated unit/integration/e2e tests.
11. Generate a typed Supabase database definition from the actual project schema instead of maintaining hand-written database types.
12. Remove `index.html` only after feature parity and production verification.

## Validation

GitHub Actions has been added to run `npm install`, `npm run lint`, and `npm run build` on pushes and pull requests. No workflow run is currently visible in GitHub, so the build has not yet been independently verified by CI. The local machine should run the same commands after pulling the latest `main`.
