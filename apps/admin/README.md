# Porulle Admin

A porulle-native operations console for the Porulle Starter — Next.js 16, shadcn/ui,
Tailwind, TanStack Table. Talks to the porulle backend over `@porulle/sdk`.

## The "1" (build-for-one thesis)

> The smallest admin that lets one operator run porulle's **daily commerce loop**
> end-to-end — **stock it → sell it → fulfill it → know who bought** — and that
> doubles as the canonical, clonable reference pattern for every porulle domain a
> developer will extend.

Two audiences, one artifact: the **operator** (the loop must actually work) and the
**developer** cloning this starter (each screen is the copy-paste pattern for that
porulle capability). Every increment points at that loop — not at Shopify/Medusa
feature-parity.

The full end-state and its rings live in [VISION.md](./VISION.md). What ships today:

| Area | What it does | porulle endpoints |
|------|--------------|-------------------|
| **Products** | List, create, edit, archive; price, image, stock; brand + categories; variants | `catalog/entities`, `pricing/prices`, `media/*`, `inventory/adjust`, `catalog/brands`, `catalog/categories`, variants/options |
| **Categories / Brands** | CRUD (+ archive/restore) and assignment to products | `catalog/categories/*`, `catalog/brands/*` |
| **Orders** | List, detail (items/totals/address), advance status, **capture / refund**, **draft/manual order creation** | `orders`, `orders/{id}/status`, `/capture`, `/refund`, `POST /orders` |
| **Customers** | List, detail, order history, interaction notes | `customers`, `/{id}/orders`, `/{id}/interactions` |
| **Promotions** | Create / list / deactivate discounts | `promotions/*` |
| **Search** | Live ⌘K catalog search | `search` |
| **Dashboard** | Product / order / revenue overview | aggregated |

> Payment capture and refunds require porulle **0.7.0+** (`@porulle/core` `^0.7.0`).

This is **definite direction, lean increments**: build the end-state shape, not
speculative capability.

## Setup

```bash
# 1. Provision the admin login user + admin-scoped API key (prints env values)
pnpm --filter backend key:admin

# 2. Copy the printed values into apps/admin/.env.local (see .env.example)
#    PORULLE_API_URL, PORULLE_ADMIN_API_KEY, ADMIN_EMAILS, ADMIN_SESSION_SECRET

# 3. Regenerate typed API bindings from the live OpenAPI (optional; after backend changes)
pnpm --filter admin codegen

# 4. Run it (port 3001)
pnpm --filter admin dev
```

## Architecture

- **Auth** (`src/lib/auth.ts`): porulle Better Auth email/password sign-in
  (server-to-server) + an `ADMIN_EMAILS` allowlist, gated by an HMAC-signed httpOnly
  `admin_session` cookie. No Clerk.
- **Data layer** (`src/lib/porulle/*`): server-only view-models over `@porulle/sdk`
  with `openapi-typescript`-generated types. Privileged writes use a server-side
  admin-scoped API key (`pk_admin_`, scope `admin`) — never exposed to the browser.
- **Features** (`src/features/*`): client tables/forms + server actions that call the
  data layer behind `requireAdmin()`.
