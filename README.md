# 🇰🇪 RedNote — Nairobi Social & Marketplace Platform

RedNote is a mobile-first social discovery and marketplace platform for Nairobi and Kenya. It combines creator posts, profiles, realtime messaging and notifications, marketplace products, shopping carts, transactional checkout, M-Pesa payments, and Supabase Storage.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, RLS, Storage and Realtime
- Safaricom Daraja M-Pesa STK Push
- Vercel
- GitHub Actions

## Features

- Social feed with categories, likes, comments, saves and follows.
- User profiles and avatar uploads.
- Realtime messaging and notifications.
- Marketplace products and seller ownership.
- Cart management and atomic checkout.
- 15-minute inventory reservations with automatic expiry.
- M-Pesa STK Push initiation and callback reconciliation.
- Secure avatar, post and product image uploads.
- Server-side validation and database constraints.
- RLS-scoped user data and server-only privileged operations.

## Getting started

### Prerequisites

- Node.js 24+
- npm
- Supabase project
- GitHub account
- Vercel account for deployment

### Install

```bash
git clone https://github.com/rashidnjoroge7-blip/redme.git
cd redme
npm install
```

### Environment

Create `.env.local` locally. Never commit secrets.

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY

MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=YOUR_CONSUMER_KEY
MPESA_CONSUMER_SECRET=YOUR_CONSUMER_SECRET
MPESA_PASSKEY=YOUR_PASSKEY
MPESA_SHORTCODE=YOUR_SHORTCODE
MPESA_CALLBACK_URL=https://YOUR_DOMAIN/api/payments/mpesa/callback
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline

INTERNAL_CRON_SECRET=YOUR_RANDOM_CRON_SECRET
```

`SUPABASE_SERVICE_ROLE_KEY`, M-Pesa credentials, and `INTERNAL_CRON_SECRET` are server-only and must never use a `NEXT_PUBLIC_` prefix.

### Database

Apply every SQL migration in `supabase/migrations/` in filename order using the Supabase migration workflow. Verify the resulting RLS policies, Storage buckets, functions, indexes and constraints before production use.

## Development

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm start
```

Development server: `http://localhost:3000`.

## Checkout

```text
Cart
  ↓
POST /api/checkout
  ↓
Atomic PostgreSQL checkout
  ↓
15-minute inventory reservation
  ↓
Pending order
  ↓
POST /api/payments/mpesa/initiate
  ↓
Daraja OAuth + STK Push
  ↓
Customer completes payment
  ↓
/api/payments/mpesa/callback
  ↓
Validate checkout request, amount, phone and receipt
  ↓
PAID → PROCESSING
```

Expired unpaid reservations are released by `/api/inventory/release-expired`, protected by `INTERNAL_CRON_SECRET` and scheduled through Vercel Cron.

## Media

```text
Authenticated browser
  ↓
POST /api/storage/sign-upload
  ↓
Server validates bucket, MIME type and size
  ↓
Signed Supabase Storage upload
  ↓
User-scoped object path
```

Buckets:

- `avatars` — 5 MB
- `post-media` — 10 MB
- `product-media` — 10 MB

Supported formats: JPEG, PNG and WebP.

## Project structure

```text
redme/
├── app/
│   ├── api/                 # Server-side API routes
│   ├── account/
│   ├── auth/
│   ├── feed/
│   ├── marketplace/
│   ├── messages/
│   ├── notifications/
│   ├── profile/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/              # Reusable React components
├── lib/
│   ├── payments/            # Daraja integration
│   └── supabase/             # Browser/server clients
├── supabase/
│   └── migrations/          # Ordered PostgreSQL migrations
├── types/                   # TypeScript types
├── public/                  # Static assets
├── .github/workflows/ci.yml # CI
├── next.config.ts
├── package.json
└── README.md
```

## Security model

- Supabase Auth identifies users through server-side session claims.
- RLS protects user-owned database records.
- Checkout is performed through a restricted atomic database function.
- Clients cannot directly manufacture authoritative orders or payment states.
- Daraja and service-role credentials remain server-only.
- Storage writes are restricted to authenticated user-owned paths.
- Database constraints restrict media references to RedNote Storage buckets.
- Internal reconciliation and maintenance functions are not public RPC endpoints.

## CI

`.github/workflows/ci.yml` is the single authoritative GitHub Actions workflow. It runs for pushes and pull requests targeting `main` and executes:

1. `npm install`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`

## Deployment

Deploy the Next.js application to Vercel or another Node-compatible Next.js host. Configure all required environment variables in the hosting provider.

Before enabling production M-Pesa:

- apply and verify all Supabase migrations;
- verify RLS and Storage policies;
- configure the production Daraja application;
- configure the HTTPS callback URL;
- test successful, failed, duplicate and invalid callbacks;
- test reservation expiry and stock restoration;
- run lint, typecheck and production build successfully.

## Migration note

The application has migrated from the original single-file HTML implementation to the Next.js App Router architecture. `index.html` is retained temporarily as a migration artifact until final surface/reference verification is complete; it is not the Next.js application entry point.

## License

MIT
