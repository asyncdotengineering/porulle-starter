# AGENTS.md — Porulle Admin

This file provides essential information for AI coding agents working on the **Porulle Admin** app. It describes the *actual* stack and patterns — not a generic starter template.

---

## Project Overview

**Porulle Admin** is the operator control plane for a Porulle headless commerce store. It is a Next.js 16 admin dashboard that talks directly to a `@porulle/core` backend over REST (via `@porulle/sdk`).

- **Framework**: Next.js 16.2.6 (App Router)
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (New York style)
- **Authentication**: Better Auth (porulle backend) + custom `ADMIN_EMAILS` allowlist
- **Charts**: Recharts
- **Package Manager**: pnpm

---

## Technology Stack Details

### Core Framework & Runtime

- Next.js 16.2.6 with App Router
- React 19.2.4
- TypeScript 5.7.2 with strict mode enabled

### Styling & UI

- Tailwind CSS v4 (`@import 'tailwindcss'` syntax)
- PostCSS with `@tailwindcss/postcss` plugin
- shadcn/ui component library (Radix UI primitives)
- CSS custom properties for theming (OKLCH color format)
- 10 built-in themes in `src/styles/themes/` (default: `vercel`)

### State Management

- Zustand 5.x for local UI state (chat, kanban, notifications) — *legacy from template; not used in daily loop*
- Nuqs for URL search params state management
- TanStack Form + Zod for form handling (via `useAppForm` hook)

### Data Fetching & Caching

- **TanStack React Query** for server-state fetching, caching, and mutations
- Server-side prefetching with `HydrationBoundary` + `dehydrate`
- Client-side `useQuery` + nuqs `shallow: true` for tables (no RSC round-trips on pagination/filter)
- `useMutation` + `invalidateQueries` for form submissions
- Query client singleton in `src/lib/query-client.ts`

### Authentication & Authorization

There is **no Clerk**. Authentication is handled against the porulle backend's Better Auth:

1. `src/lib/auth.ts` — custom HMAC-signed session cookie (`admin_session`)
2. `signInAdmin(email, password)` — POSTs to `${PORULLE_API_URL}/api/auth/sign-in/email`, then checks `ADMIN_EMAILS` allowlist
3. `requireAdmin()` — server-side guard that redirects to `/auth/sign-in` if the session is missing/expired
4. `signOutAdmin()` — deletes the cookie

Environment variables:
- `PORULLE_API_URL` — backend base URL (default `http://localhost:4000`)
- `PORULLE_ADMIN_API_KEY` — admin-scoped API key for server-to-server SDK calls
- `ADMIN_EMAILS` — comma-separated allowlist (e.g. `admin@example.com,ops@example.com`)
- `ADMIN_SESSION_SECRET` — HMAC secret for cookie signing (default `dev-admin-session-secret-change-me`)

### Data Layer — `@porulle/sdk`

All backend communication goes through `@porulle/sdk` with types generated from the live backend's OpenAPI:

```
src/lib/porulle/
  client.ts           — SDK client singleton (server-only, api-key auth)
  generated/api-types.ts — openapi-typescript output (regenerated via `pnpm codegen`)
  types.ts            — Admin view-models (ProductRow, OrderRow, CustomerRow, ...)
  products.ts         — SDK calls for product CRUD
  orders.ts           — SDK calls for orders
  customers.ts        — SDK calls for customers
  categories.ts       — SDK calls for categories
  brands.ts           — SDK calls for brands
  inventory.ts        — SDK calls for inventory / low-stock
  promotions.ts       — SDK calls for promotions
  pricing.ts          — SDK calls for pricing rules
  search.ts           — SDK calls for search
  media.ts            — SDK calls for media upload
  ops.ts              — SDK calls for health / jobs
  variants.ts         — SDK calls for variant management
```

The SDK client is created with `createClient<paths>()` where `paths` comes from `generated/api-types.ts`.

### Query Key Factories

Each feature defines a key factory for type-safe cache invalidation:

```tsx
export const entityKeys = {
  all: ['entities'] as const,
  list: (filters: EntityFilters) => [...entityKeys.all, 'list', filters] as const,
  detail: (id: number) => [...entityKeys.all, 'detail', id] as const
};
```

### Data Tables

Tables use TanStack Table with React Query:
- Query options in `features/*/api/queries.ts` (or inline in components for small tables)
- Column definitions in `features/*/components/*-tables/columns.tsx`
- Table component in `src/components/ui/table/data-table.tsx`

---

## Project Structure

```
src/
  app/
    auth/sign-in/[[...sign-in]]/   — Better Auth sign-in page
    dashboard/
      overview/                    — Dashboard analytics
      products/                    — Product list + new + edit
      categories/                  — Category CRUD
      brands/                      — Brand CRUD
      orders/                      — Order list + detail + new draft
      customers/                   — Customer list + detail
      promotions/                  — Promotion list
      inventory/                   — Low-stock view
      health/                      — Jobs / system health
    layout.tsx                     — Root layout with providers
    page.tsx                       — Landing redirect to /auth
  components/
    ui/                            — shadcn/ui components
    layout/                        — Sidebar, header, info sidebar
    icons.tsx                      — Centralized icon registry (@tabler/icons-react)
    themes/                        — Theme system
  features/
    auth/                          — Sign-in form + server action
    products/                      — Product table, forms, mutations
    customers/                     — Customer table + detail
    orders/                        — Order table + detail + timeline
    promotions/                    — Promotion table + form
    ops/                           — Health / job status components
    search/                        — ⌘K global search
  config/
    nav-config.ts                  — Sidebar navigation groups
  lib/
    auth.ts                        — Session + sign-in/out
    porulle/                       — SDK layer (see above)
    query-client.ts                — React Query singleton
    utils.ts                       — cn() and formatters
    data-table.ts                  — Table state helpers
```

---

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm --filter admin dev          # Starts at http://localhost:3001

# Build for production
pnpm --filter admin build

# Type-check
pnpm --filter admin check-types

# Codegen (requires backend running on :4000)
pnpm --filter admin codegen
```

---

## Environment Configuration

Copy `env.example.txt` to `.env.local`:

```env
# Backend connection
PORULLE_API_URL=http://localhost:4000
PORULLE_ADMIN_API_KEY=pk_admin_...

# Admin access control
ADMIN_EMAILS=admin@example.com,ops@example.com
ADMIN_SESSION_SECRET=change-me-in-production
```

---

## Code Style Guidelines

### TypeScript

- Strict mode enabled
- Use explicit return types for public functions
- Prefer interface over type for object definitions
- Use `@/*` alias for imports from `src`

### Component Conventions

- Use function declarations for components: `function ComponentName() {}`
- Props interface named `{ComponentName}Props`
- shadcn/ui components use `cn()` utility for class merging
- Server components by default, `'use client'` only when needed

### Data Layer Conventions

- All backend calls go through `src/lib/porulle/*` — never call `fetch()` directly from components
- Use `server-only` for SDK client imports
- Mutations invalidate query keys via `queryClient.invalidateQueries({ queryKey: entityKeys.all })`

### Icon System

**All icons come from `src/components/icons.tsx`.**

The project uses `@tabler/icons-react` as the sole icon package. Every icon is re-exported through a centralized `Icons` object — **never import directly from `@tabler/icons-react`**.

```tsx
import { Icons } from '@/components/icons';
<Icons.search className='h-4 w-4' />
```

### Page Headers

Always use `PageContainer` props (`pageTitle`, `pageDescription`, `pageHeaderAction`) for page headers. Never import `<Heading>` manually in pages — `PageContainer` handles that internally.

### Button Loading

Use `<Button isLoading={isPending}>` for loading states. `SubmitButton` in forms handles this automatically via form `isSubmitting` state.

---

## Navigation

Navigation is defined in `src/config/nav-config.ts` as groups of `NavItem`:

- Overview → Dashboard
- Catalog → Products, Categories, Brands
- Sales → Orders, Customers, Promotions
- Operations → Low stock, Health

There is **no RBAC filtering** in navigation — the `requireAdmin` guard handles access control at the layout level.

---

## Notes for AI Agents

1. **Always use `cn()` for className merging** — never concatenate strings manually
2. **Respect the feature-based structure** — put new feature code in `src/features/`
3. **Server components by default** — only add `'use client'` when using browser APIs or React hooks
4. **Type safety first** — avoid `any`, prefer explicit types
5. **Follow existing patterns** — look at similar components before creating new ones
6. **Environment variables** — prefix with `NEXT_PUBLIC_` for client-side access
7. **shadcn components** — don't modify files in `src/components/ui/` directly; extend them instead
8. **Icons** — NEVER import icons directly from `@tabler/icons-react` or any other icon package. All icons must be registered in `src/components/icons.tsx` and imported as `import { Icons } from '@/components/icons'`.
9. **Data layer** — All backend calls go through `src/lib/porulle/*`. Components import view-models from `src/lib/porulle/types.ts`.
10. **No Clerk / Sentry / mock-api** — this app uses real porulle Better Auth and talks to a real backend. Do not add Clerk or mock data layers.
