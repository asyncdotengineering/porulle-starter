# RFC-0001 — Complete the Porulle starter (0.7 → 0.10, make it the default)

**Status:** Ready to implement · **Type:** feature · **Owner handoff:** delegated build

## Summary

`porulle-starter` is a clean, runnable reference for the porulle **0.7.0** daily
commerce loop (backend + Next.js storefront + admin), but it is frozen at 0.7.0
(last touched 2026-07-02) with known scope holes. Porulle is now **0.10.0**
(published to npm today), which both closes the currency gap and *unblocks*
several admin journeys the starter deferred. This RFC brings the starter current,
makes all three apps build/typecheck/run against 0.10.0, and completes the
missing end-user and operator flows — the bar to ship it as the **default
Porulle starter**.

## Problem & motivation

- Every `@porulle/*` dep is pinned `^0.7.0` (backend: core + adapter-postgres/
  local-storage/stripe; storefront + admin: `@porulle/sdk`). The caret resolves
  within 0.7.x only — `pnpm install` will **not** pick up 0.10.0.
- The starter's codegen (`openapi-typescript $PORULLE_API_URL/api/doc -o …`)
  regenerates frontend types from the **running backend's** OpenAPI. Stale types
  ⇒ the frontends are typed against the 0.7 surface.
- The backend runs on `postgresAdapter` — it needs a Postgres **server** to boot
  (and therefore to codegen). This is the same install-friction Medusa has.
- Deferred-by-design gaps: storefront has **no customer accounts / auth / order
  history**; faceted filter **UI exists but is fed empty facets**; admin has 7
  operator journeys marked "blocked on porulle 0.7" (fulfillment tracking,
  scheduled-sale management, order line-item edits, RBAC, gift cards, tax/
  shipping-zone config) — **several now exist in 0.8–0.10** (gift cards, tax
  classes, order notes/timeline, scheduled orders, PIN/RBAC auth).
- `apps/admin/AGENTS.md` is stale template boilerplate (describes Clerk, Sentry,
  mock-api, kanban/chat routes) that the app does not use — it will send an
  agent down the wrong path. Root README omits the admin app.

**Success:** all three apps `pnpm build` + `check-types` green against 0.10.0;
the backend boots **zero-infra** (PGlite) and serves `/api/doc`; codegen’d types
match 0.10.0; the storefront supports account + order history and real faceted
filtering; the admin exposes every operator journey the 0.10 API now backs; docs
are accurate.

## Non-goals

- No new payment providers beyond Stripe (+ dev-mock). No CMS, no multi-market
  i18n, no theming system. No test suite build-out beyond a smoke check.
- Not every one of the 7 admin journeys is in scope if the 0.10 API still lacks
  the endpoint — implement the ones 0.10 backs; leave a documented stub +
  upstream note for any that remain genuinely unbacked.

## Detailed design

### Phase 1 — Currency + zero-infra run (this is the Definition of Done)

1. **Bump all `@porulle/*` to `^0.10.0`** in `apps/{backend,storefront,admin}/
   package.json`; `pnpm install`.
2. **Backend → zero-infra dev default.** Add `@porulle/adapter-pglite@^0.10.0`;
   in `apps/backend/commerce.config.ts` default `databaseAdapter` to
   `await pgliteAdapter({ path: "./.data/pgdata" })` when `DATABASE_URL` is
   unset, else `postgresAdapter({ connectionString: DATABASE_URL })`. Keep the
   Stripe-or-dev-mock payments logic. (This makes `pnpm dev` run with no DB to
   install, and lets codegen run.)
3. **Boot backend + seed**, then **codegen** both frontends:
   `pnpm --filter storefront codegen` and `pnpm --filter admin codegen`
   (regenerates `…/generated/api-types.ts` from the live 0.10 `/api/doc`).
4. **Fix 0.7→0.10 API drift** surfaced by `pnpm check-types` across all apps —
   renamed/added fields, endpoint shape changes, SDK client changes. Iterate
   until green.
5. **Docs:** rewrite `apps/admin/AGENTS.md` to the *actual* stack (Better Auth +
   `ADMIN_EMAILS`, real `@porulle/sdk` view-models under `src/lib/porulle/`,
   Next 16, no Clerk/Sentry/mock-api). Update root `README.md` to include the
   admin app and the PGlite-default / mock-payments behavior.

**Phase 1 DoD:** `pnpm build` + `pnpm check-types` green for all three apps
against 0.10.0; `pnpm dev` boots backend on PGlite serving `/api/doc`; codegen
runs clean; frontends compile against regenerated types.

### Phase 2 — Feature completion (drive as far as budget allows; ordered)

6. **Storefront customer accounts** — add `app/(account)` routes: sign-in/up
   (porulle Better Auth), account overview, **order history** + order detail
   (post-purchase surface). Wire to the SDK's customer/orders endpoints.
7. **Storefront faceted filters** — populate real facet values in
   `lib/commerce/operations/{collections,search}.ts` from the 0.10 search API
   (`GET /api/search?facets=…` / category+attribute facets) so the existing
   `filter-sidebar` renders live facets instead of empty arrays.
8. **Admin unblocked journeys** — for each of {fulfillment tracking, scheduled-
   sale list/create/delete, order line-item edits, gift cards, tax/shipping-zone
   config, staff RBAC}: if the 0.10 OpenAPI exposes it, build the admin screen +
   view-model; if not, leave a clearly-labeled "requires porulle vX" stub and
   note it. Prioritize gift cards, scheduled sales, tax config, fulfillment
   (most likely already backed by 0.8–0.10).

## Requirements (REQ-N)

- **REQ-1** All three apps depend on `@porulle/* ^0.10.0`; lockfile updated.
- **REQ-2** Backend boots with **no DATABASE_URL** on PGlite and serves
  `/health` + `/api/doc`; `postgresAdapter` used when `DATABASE_URL` is set.
- **REQ-3** `pnpm --filter {storefront,admin} codegen` regenerates types from the
  live 0.10 backend without error.
- **REQ-4** `pnpm check-types` and `pnpm build` are green for all three apps.
- **REQ-5** `apps/admin/AGENTS.md` describes the real stack; root README includes
  admin + PGlite/mock-payments notes.
- **REQ-6** Storefront: account sign-in + order-history routes exist and compile
  against the SDK.
- **REQ-7** Storefront: faceted filter operations return real facet values.
- **REQ-8** Admin: each 0.10-backed operator journey has a working screen;
  genuinely-unbacked ones are stubbed + documented (no silent omission).

## Verification surface

- `pnpm install && pnpm --filter backend build` → green.
- `pnpm --filter backend dev` (no DATABASE_URL) → boots; `curl localhost:4000/health` = ok; `curl localhost:4000/api/doc` = OpenAPI JSON.
- `pnpm --filter storefront codegen && pnpm --filter admin codegen` → exit 0.
- `pnpm check-types` (all) → 0 errors. `pnpm build` (all) → success.
- Manual/smoke: storefront home + PDP + cart + checkout render; `/account` +
  order history render; admin dashboard + the new journey screens render.

## Decomposition sketch (order)

Phase 1: (1) bump+install → (2) backend pglite → (3) boot+seed+codegen → (4)
drift-fix to green → (5) docs. Then Phase 2: (6) accounts → (7) facets → (8)
admin journeys. Phase 1 gates everything; land it green before Phase 2.

## Unresolved questions

- Exactly which of the 7 admin journeys the 0.10 OpenAPI backs is unknown until
  codegen runs — resolve empirically from the regenerated types, not assumption.
- Whether the storefront should default-hide account UI if auth is disabled —
  proposed: show it; it's a starter demonstrating the flow.
