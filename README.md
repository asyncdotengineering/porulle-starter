# Porulle Starter

A production-ready headless commerce starter: a **[porulle](https://github.com/asyncdotengineering/porulle)**
backend (self-hosted, REST) + a **Next.js 16** storefront + an **admin dashboard**,
with **Stripe** as the payment gateway via a custom Stripe Payment Element checkout.
The storefront's entire data layer is porulle-native behind a provider-agnostic
domain-type contract.

```
porulle-starter/
├── apps/
│   ├── backend/      # porulle commerce server (PGlite/Postgres + Stripe + seed)
│   ├── storefront/   # Next.js 16 storefront (App Router, RSC, Tailwind 4)
│   └── admin/        # Next.js 16 admin dashboard (operator control plane)
├── package.json      # turbo + pnpm workspace
└── turbo.json
```

## How it fits together

- **porulle** is the headless commerce engine. It exposes a hardened REST API
  (`/api/catalog`, `/api/carts`, `/api/checkout`, `/api/search`, …) generated from
  `commerce.config.ts`. It owns the catalog, cart, pricing, inventory, orders, and
  payments. See `apps/backend/commerce.config.ts`.
- The **storefront** is pure presentation. It reads the catalog server-side via the
  typed `@porulle/sdk` client and runs cart/checkout through server actions. It never
  embeds the database or payment secrets. The provider seam is `lib/types.ts` (the
  contract between data and components); everything porulle-specific lives in
  `lib/commerce/`.
- The **admin** is the operator control plane. It uses `@porulle/sdk` with an admin-scoped
  API key to manage products, orders, customers, categories, brands, promotions, and
  inventory. Authentication is handled against porulle's Better Auth with an
  `ADMIN_EMAILS` allowlist. See `apps/admin/AGENTS.md`.
- **Stripe** is wired through `@porulle/adapter-stripe` on the backend. Checkout
  creates a Stripe PaymentIntent and returns its client secret; the storefront
  confirms the card with the Stripe Payment Element; porulle's Stripe webhook
  marks the order paid.

## Prerequisites

- Node ≥ 20, pnpm 10
- PostgreSQL (optional — the backend defaults to **PGlite**, an embedded Postgres,
  so no external database is required for a first run)
- A Stripe account (test mode is fine) — optional for a first run (see below)

## Quick start

```bash
pnpm install

# 1. Apply the schema and seed a demo catalog (zero-infra — uses PGlite)
pnpm --filter backend db:push
pnpm --filter backend seed

# 2. Mint the storefront's server API key (cart/checkout writes require auth;
#    catalog reads are anonymous). This is a storefront-scoped key (pk_porulle_) —
#    NOT the admin key, which deliberately has no cart permissions.
pnpm --filter backend key:create
#   → prints PORULLE_STOREFRONT_API_KEY="pk_porulle_..."

# 3. Mint the admin's server API key (full catalog/inventory/orders management).
pnpm --filter backend key:admin
#   → prints PORULLE_ADMIN_API_KEY="pk_admin_..."

# 4. Point the apps at the backend
cp apps/storefront/.env.example apps/storefront/.env.local
#   set PORULLE_STOREFRONT_API_KEY to the pk_porulle_ key from step 2
#   (PORULLE_API_URL defaults to http://localhost:4000 — fine for local)

cp apps/admin/.env.example apps/admin/.env.local
#   set PORULLE_ADMIN_API_KEY to the pk_admin_ key from step 3
#   set ADMIN_EMAILS to a comma-separated list of admin emails
#   (PORULLE_API_URL defaults to http://localhost:4000)

# 5. Run all three apps
pnpm dev
```

> `key:create` and `key:admin` each boot their own short-lived backend instance.
> On the PGlite default (zero-infra), PGlite is single-writer, so run these with
> the backend **stopped**, then start it — a key minted while the backend is up
> won't be visible until it restarts. On a real Postgres (`DATABASE_URL` set) the
> key is visible immediately, no restart needed. porulle is security-hardened:
> anonymous clients can read the catalog but not create carts/orders, so the
> storefront proxies those writes with an API key.

- Backend → http://localhost:4000 (`/api`, `/api/doc`, `/api/reference`)
- Storefront → http://localhost:3000
- Admin → http://localhost:3001

Browse → add to cart → checkout. **Without Stripe keys**, checkout uses the
backend's dev mock payment adapter and skips the card form, so you can walk the
whole funnel immediately.

## Zero-infra default (PGlite)

By default, when `DATABASE_URL` is **not set**, the backend uses `@porulle/adapter-pglite`
— an embedded Postgres that stores data in `./.data/pgdata`. This means:

- No Docker, no `createdb`, no managed Postgres required for a first run.
- `pnpm --filter backend db:push` works immediately.
- Data persists across restarts in the local directory.

To switch to a real Postgres server, set `DATABASE_URL` in `apps/backend/.env`:

```bash
cp apps/backend/.env.example apps/backend/.env
# edit apps/backend/.env → DATABASE_URL (and optionally Stripe keys)
```

## Enabling real Stripe

1. Get test keys at https://dashboard.stripe.com/test/apikeys.
2. Backend (`apps/backend/.env`): set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
3. Storefront (`apps/storefront/.env.local`): set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
4. Forward webhooks in dev:
   ```bash
   stripe listen --forward-to localhost:4000/api/payments/webhook
   ```
   Use the `whsec_…` it prints as `STRIPE_WEBHOOK_SECRET`.
5. Restart both apps. Checkout now renders the Stripe Payment Element; pay with a
   test card (`4242 4242 4242 4242`, any future expiry/CVC). The webhook confirms
   the order on `payment_intent.succeeded`.

## What's included vs. follow-ups

**Included and working on porulle:**

- **Storefront**: product listing, product detail pages with size/color variants,
  collections (categories), search, optimistic cart, a custom Stripe checkout +
  order confirmation, and an optional AI shopping assistant. SEO (sitemap,
  `llms.txt`, JSON-LD, markdown route negotiation) is wired to porulle data.
- **Admin**: dashboard overview, product CRUD (with variants, images, pricing),
  category/brand CRUD, order list + detail + status management, customer list +
  detail, promotions, low-stock view, and system health.

**Clean follow-ups** (the porulle endpoints to use are noted in
`apps/storefront/AGENTS.md` and `apps/admin/VISION.md`): customer accounts/auth
in the storefront, CMS-backed content, multi-market i18n, rich faceted filtering,
per-variant inventory display, gift cards, scheduled sales, and tax/shipping-zone
config in the admin.

## Notes

- Seeded product imagery is carried as URLs in entity `metadata.images` (deterministic
  picsum placeholders). For production, upload assets through porulle's media module
  and add your media host to `apps/storefront/next.config.ts` `images.remotePatterns`.
- The admin app is Better Auth-based, not Clerk. See `apps/admin/AGENTS.md` for the
  real stack, patterns, and environment variables.
- porulle docs: https://porulle-docs.vercel.app

MIT.
