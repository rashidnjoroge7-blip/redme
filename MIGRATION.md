# RedNote Next.js Migration

## Status

Phase 1 is complete on `main`. The legacy `index.html` remains in the repository as a migration reference and has not been deleted.

## New stack

- Next.js 16.3.3 (Active LTS security line)
- React 19
- TypeScript
- Tailwind CSS 4.3
- Supabase Auth / PostgreSQL / Realtime / Storage
- ESLint

## New architecture

```text
app/
  layout.tsx       Root metadata and global styles
  page.tsx         RedNote home route
components/
  auth/
    AuthPanel.tsx  React/Supabase authentication UI
  feed/
    FeedShell.tsx  Feed component boundary
lib/
  supabase/
    client.ts      Browser client
    server.ts      Server client
middleware.ts      Supabase session refresh
```

## Authentication changes

The React migration uses `@supabase/ssr` rather than the legacy CDN-loaded Supabase client. Browser authentication is isolated in `lib/supabase/client.ts`; server-side access is isolated in `lib/supabase/server.ts`; middleware refreshes the authenticated session.

The browser client expects:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Do not place a Supabase service-role key in `NEXT_PUBLIC_*` variables or client components.

## Phase 2

1. Port the existing feed data and Supabase queries.
2. Port posts, comments, likes, saves and follows.
3. Port profile and user settings.
4. Port notifications and Supabase Realtime subscriptions.
5. Port messaging and conversation authorization.
6. Port marketplace, cart and orders.
7. Add M-Pesa server-side integration through Next.js route handlers/server actions.
8. Port admin/moderation functionality with server-side authorization and RLS.
9. Replace legacy CSS with reusable Tailwind components while preserving the current visual design.
10. Add automated tests and production build validation.

## Legacy application

`index.html` remains untouched during migration. This prevents the migration from destroying the working reference implementation. It should only be removed after feature parity and production verification.
