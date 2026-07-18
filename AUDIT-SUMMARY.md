# Screens Audit Summary — porulle-starter UI

Four-phase feature audit of the entire starter UI (Next.js **storefront** + **admin**). Source of truth: `porulle-starter-feature-audit.csv` (60 rows, one per user story). Expected behaviour written through the `design-reality-check` / `design-psychology` lenses (real-user states, no dead-ends, honest empty/error states, confirmation for irreversible actions).

## Counts by status

| Status | Count |
|---|---|
| `tested` (passed as-is, Phase 2) | 29 |
| `retested-pass` (defect fixed + verified, Phase 3–4) | 24 |
| `error` (defect left open — deferred, with reason) | 7 |
| **Total features audited** | **60** |

**Defects found:** 31 · **Fixed & verified:** 24 · **Deferred (documented):** 7.

## What was fixed (24, by cluster)

- **Destructive actions now confirm (6)** — one reusable `ConfirmAction` (shadcn AlertDialog) gates: archive product (A003), cancel/refund status transitions (A013), refund payment (A014, reason no longer hardcoded), delete brand (A019), deactivate promotion (A020), delete pricing modifier (A022). *(ux:states-are-features — irreversible actions must not fire on a single click.)*
- **Errors no longer masked as empty (9)** — removed `withFallback`/`catch→[]` so outages surface a real error state instead of a false "you have no X": cart + nav cart icon (F014/F028), customer profile (F024), order history (F025), pricing-modifiers/tax/shipping/staff lists (A022/A025/A026/A027), and the admin DataTable now renders loading/error states (A029).
- **Missing loading/error boundaries added (F001, F007, F011, F019, F030)** — `loading.tsx` + `error.tsx` across account/*, checkout, collections, collections/all; home no longer shows a titled void on an empty catalog.
- **Logic fixes (A002, A008, F004, F020, F026, F029, A028)** — revenue KPI excludes cancelled/refunded; image preview uses the stored URL not a local blob; PDP shows a disabled "Select options" instead of a vanishing buy button; confirmation verifies the order against the backend instead of trusting URL params; account order-detail parses real line items + shipping address; header account control is auth-aware; ⌘K routes non-product hits meaningfully. About-page placeholder copy replaced (F021).

## Unresolved — left `error` with reason (7)

These were **not faked**. Each is either blocked on a backend surface the 0.10 API doesn't expose, or a genuine multi-component build outside "smallest defensible change."

| id | Feature | Why deferred |
|---|---|---|
| **F015** | Cart discount code | 0.10 OpenAPI has **no** cart-level discount endpoint; `updateCartDiscountCodes` is a documented no-op (promotions apply at checkout). Fix requires an upstream API or hiding the field. |
| **A024** | Gift cards | 0.10 OpenAPI has **no** `/api/giftcards`; the nav item dead-ends to a stub. Needs the endpoint (or remove the nav item). |
| **A015** | Order fulfillment | Backend exposes `POST /api/orders/{id}/fulfillments` + line-item endpoints, but a create-fulfillment UI (carrier/tracking/line selection) + wiring line-item edits is a several-screen build. |
| **A012** | Manual/draft order | *Partial:* qty NaN fixed. Remaining: hardcoded tax/discount/shipping + no customer/address selection require a customer picker, address form, and a charge calculator. |
| **A025** | Tax config | *Partial:* false-empty fixed (lists throw on error). Remaining: create/edit/delete forms for classes/rates (backend POSTs exist). |
| **A026** | Shipping config | *Partial:* false-empty fixed. Remaining: create-zone/add-rate forms. |
| **A027** | Staff & roles | *Partial:* false-empty fixed. Remaining: invite-staff/assign-role forms (backend `POST /api/admin/staff/invitations` exists). |

## Verification

- `pnpm check-types` — **green (3/3)** after fixes.
- `pnpm build` — **green** (admin + storefront, backend up on PGlite).
- Flagship fixes spot-checked against source (ConfirmAction wired to the destructive actions; `customer.ts` throws on error; new error/loading boundary files present).

## Method & coverage caveat

The starter ships **no test harness** and running 60 UI flows in a browser was out of scope, so testing was by **grounded code-path tracing** — every row cites `path:line`. This reliably catches logic defects, missing states, dead-ends, and error-masking, but does **not** exercise live runtime rendering. **Recommended follow-up:** a Playwright e2e pass over the happy + unhappy paths, and a delegated build for the 5 deferred feature-gaps (fulfillment UI, tax/shipping/staff CRUD, draft-order customer picker) plus the 2 upstream-API gaps (cart discount, gift cards) once/if 0.10.x adds them.

No screen was left unrepresented in the inventory.
