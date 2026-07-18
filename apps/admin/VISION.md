# The Master Admin — End Goal (build-for-one)

This is the destination the admin is being built toward. The [README](./README.md)
covers the shipped daily loop; this document names the full "1" and the coherent rings
that reach it, so every increment can be measured against the end state rather than the
last ticket.

## The "1"

> A **single-operator control plane** where a merchant runs the entire store lifecycle
> against porulle — **structure** the catalog, **price & promote** it, **stock** it,
> **sell & fulfill** it, and **know the customer** — end-to-end, without ever touching
> the REST API or the database.

Success test — the press release: *"A shop owner opens the admin and, with no engineer
and no API client, launches a product with variants and photos, files it under a
category and brand, sets its price and a launch discount, watches it sell, fulfills the
order, and looks up the buyer's history — all from one console."* If any clause needs
curl or SQL, the "1" isn't reached.

Two audiences, one artifact: the **operator** (every clause above must actually work)
and the **developer** cloning this starter (each screen is the canonical, copy-paste
reference for that porulle domain).

## The rings — all roads lead to the loop

Concentric increments. Each ring is independently demoable and points at the same end
state; we finish a ring before widening to the next.

| Ring | Theme | Features | Status |
|------|-------|----------|--------|
| **0** | **Daily loop** | Products (CRUD · price · image · stock), Orders (detail · status), Customers (list · detail), Dashboard | ✅ shipped |
| **1** | **Merchandising structure** | Categories (CRUD · archive · assign), Brands (CRUD · assign), Variants (options · generate · per-variant price) | 🔨 this build |
| **2** | **Growth levers** | Promotions/Discounts (create · list · deactivate), Global search (⌘K across catalog) | 🔨 this build |
| **3** | **Clienteling** | Customer interaction notes (calls · visits · notes) | ✅ shipped |
| **4** | **Order operations** | Payment capture, refunds, draft/manual orders | ✅ shipped (porulle 0.7.0) |
| **5** | **Run the back office** | Low-stock view, Health (failed jobs + compensation failures), Support order lookup, Scheduled sales (pricing modifiers), Fulfillment view | ✅ shipped |

Ring 1 gives the catalog *shape*; ring 2 gives it *reach*; ring 3 gives the customer a
*memory*; ring 5 is the operational substrate a real store runs on. Together with ring 0
they close the merchant's full lifecycle — the "1".

## Blocked on porulle — tracked open until the REST lands

These are real operator journeys porulle 0.7.0 can't yet back over REST. Each is filed
upstream and stays open (we build the admin screen the moment the endpoint ships):

| Journey | Gap | Issue |
|---|---|---|
| Fulfillment with tracking / partial shipment | read-only REST (service exists) | porulle#40 |
| Manage scheduled sales | modifiers are create-only (no list/delete) | porulle#41 |
| Edit a placed order's line items | no line-item mutation REST | porulle#42 |
| Abandoned-checkout recovery | no cart list / status filter | porulle#43 |
| Gift cards | `@porulle/plugin-giftcards` exists but unpublished on npm | porulle#44 |
| Tax & shipping-zone config in-admin | config-only, no runtime REST | porulle#45 |
| Staff accounts & roles (RBAC) | member table exists, no admin REST | porulle#46 |

## Non-goals (deliberately outside the "1")

Named so they don't creep in as "obvious next features":

- **Analytics suites** beyond the overview counts — reporting is a separate product.
- **Multi-store / multi-region / multi-currency ops** — the starter is single-store B2C.
- **CMS / theme / content editing** — storefront presentation, not operations.
- **Staff accounts / RBAC management UI** — porulle has permissions; managing them is an
  ops-tooling concern, not the merchant loop.
- **Marketing automation, email, reviews** — adjacent products, not the control plane.

These are coherent businesses of their own; folding them in would starve the "1".

## Method

**Definite direction, lean increments.** We build the end-state *shape* of each ring
with the minimum viable capability — no speculative config, no multi-warehouse matrices,
no i18n editors — and we never ship a step that doesn't point at the "1". When porulle
can't back a clause, we say so and file upstream rather than fake it — and pick the
feature back up once it lands (refunds/capture/draft orders shipped this way once
porulle 0.7.0 added the REST endpoints).
