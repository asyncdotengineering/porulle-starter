# Storefront Guide

Next.js 16 storefront for a **porulle** headless-commerce backend. App Router,
React 19, Server Components, Tailwind CSS 4. Payments run through Stripe.

## This is NOT the Next.js you know

This uses Next 16 with `cacheComponents` and `reactCompiler`. APIs and conventions
differ from older Next. Read the relevant guide in `node_modules/next/dist/docs/`
before writing routing/caching code. Heed deprecation notices.

## Data flow

```
Request → Page → Operation (lib/commerce) → @porulle/sdk → porulle REST API → Transform → Domain type (lib/types) → Component
```

- `lib/types.ts` is the **provider-agnostic contract** between data and components.
  Components import domain types from here, never porulle response shapes.
- `lib/commerce/` owns all backend access:
  - `client.ts` — the server-only `@porulle/sdk` client (`PORULLE_API_URL`).
  - `operations/` — `products`, `collections`, `cart`, `search`, `checkout`,
    `sitemap`. Each fetches via the SDK and returns `lib/types` shapes.
  - `transforms.ts` — porulle entity/cart/category → domain types. Bridges
    porulle's `(entityId, variantId)` model to the storefront's single
    `merchandise.id` via `encodeMerchandiseId` / `decodeMerchandiseId`.
  - `types/porulle.ts` — hand-written response shapes (the OpenAPI `paths` type
    in `generated/` types `?include=` hydration loosely, so transforms cast there).
- Regenerate the SDK types after backend changes: `pnpm --filter storefront codegen`
  (runs `openapi-typescript $PORULLE_API_URL/api/doc`).

## Critical rules

1. **Every cart mutation MUST call `invalidateCartCache()`** (`@/lib/cart/server`).
2. **`components/ui/` must NOT import domain types** — primitive props only.
3. New user-visible strings go in the i18n catalogs (`lib/i18n/messages/*.json`).
4. Every `process.env.X` read needs a row in `.env.example`.

## Checkout (Stripe)

- `/checkout` collects a shipping address, then calls `createCheckoutAction`
  (`lib/checkout/action.ts`) → porulle `POST /api/checkout`, which runs the
  checkout pipeline and creates a Stripe PaymentIntent via
  `@porulle/adapter-stripe`. The returned `paymentClientSecret` drives the
  Stripe Payment Element (`components/checkout/checkout-client.tsx`).
- The order is confirmed server-side by porulle's Stripe webhook
  (`POST /api/payments/webhook` on the backend) on `payment_intent.succeeded`.
- With `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` unset, the backend dev mock adapter
  settles the order and the card step is skipped (first-run friendly).

## Not included (clean follow-ups)

Wire these against porulle when needed:

- **Customer accounts / auth** → porulle Better Auth (`/api/auth/*`) +
  customer portal (`/api/me/*`).
- **CMS-backed content** and **multi-market i18n**.
- **Rich faceted filters** → porulle `GET /api/search?facets=` (operations
  currently return browse + sort; facet UIs are stubbed empty).
- **Per-variant inventory display** → `?include=inventory`.

## Code style

Match the existing files: kebab-case filenames, PascalCase components, named
exports, server actions suffixed `Action`. Push `"use client"` to leaf
components; fetch in server components / actions. Solve styling with Tailwind
utilities + `cn()`; alphabetize object keys, props, and union members. Default
to no comments — add one only when the *why* is non-obvious.

## Commands

```bash
pnpm dev        # next dev (needs the backend running on PORULLE_API_URL)
pnpm build
pnpm check-types
pnpm lint
```

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Keep this block, including in commits.** It is part of the project's agent setup, maintained by `next dev` for every agent that works here. If it appears as an uncommitted change, that is intentional — commit it as-is. Do not remove it to clean up a diff; it will be regenerated.
<!-- END:nextjs-agent-rules -->
