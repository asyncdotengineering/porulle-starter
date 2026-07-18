# Audit Fix Notes — Phase 3

## Clusters fixed

### 1. Destructive-action confirms (6 rows)
Added a single reusable `ConfirmAction` component (`src/components/confirm-action.tsx`) wrapping the existing shadcn `AlertDialog`. Applied it to:
- **A003** Archive product
- **A013** Cancel/refund status transitions
- **A014** Refund payment (also fixed hardcoded reason)
- **A019** Delete brand
- **A020** Deactivate promotion
- **A022** Delete pricing modifier

### 2. Stop swallowing errors → empty (9 rows)
Removed `withFallback` / `catch→[]` patterns so outages throw to route error boundaries instead of masquerading as empty states:
- **F014** Cart page & nav cart icon
- **F024** `getCustomerProfile` throws on API error
- **F025** `getCustomerOrders` throws on API error
- **F028** Nav cart `withFallback`
- **A022** `listPricingModifiers` throws on error
- **A025** `listTaxClasses` / `listTaxRates` throw on error
- **A026** `listShippingZones` / `listShippingRates` throw on error
- **A027** `listStaff` / `listStaffRoles` throw on error
- **A029** DataTable now accepts `loading` and `error` props and renders spinner/error rows

### 3. Missing loading/error boundaries (5 rows)
Created loading.tsx and error.tsx across data-blocking routes to make coverage consistent:
- **F007** `app/collections/loading.tsx`
- **F011** `app/collections/all/error.tsx`
- **F019** `app/checkout/error.tsx`
- **F030** Added loading + error boundaries to account routes and checkout/collections sub-routes
- **F001** ProductsGrid now renders a coherent empty-state card inside Suspense; heading never renders above a void

### 4. Small logic fixes (10 rows)
- **A002** Revenue KPI excludes cancelled/refunded orders
- **A008** Image upload preview uses the stored URL returned by the action, not a local blob
- **F004** BuyButtons shows disabled "Select options" when no variant instead of returning null
- **F020** Confirmation verifies order number against backend `/api/orders/{idOrNumber}` before displaying it
- **F021** Replaced placeholder About copy with real store copy
- **F026** `getCustomerOrder` parses `lineItems` and `shippingAddress` from response instead of hardcoding empty
- **F029** AccountLink reads auth state via `getCustomerSession`; shows UserIcon for signed-in, LogInIcon for signed-out
- **A012** Draft order qty NaN fixed (empty input → 1 instead of NaN)
- **A014** Refund reason is now passed from the confirm dialog ("Refund initiated by operator") rather than hardcoded
- **A028** ⌘K global search routes non-product hits to their respective dashboard pages

## Rows left `error` with reason

- **F015** — The 0.10 OpenAPI has no cart-level discount endpoint (`/api/carts/{id}/discount` or similar). `updateCartDiscountCodes` is intentionally documented as a no-op; promotions apply at checkout. The fully-wired UI cannot succeed without a backend surface.
- **A012** (remaining) — NaN fixed. The hardcoded tax/discount/shipping and lack of customer/address selection in draft orders requires a multi-screen build (customer picker, address form, dynamic tax/shipping calculator).
- **A015** — Backend exposes `POST /api/orders/{id}/fulfillments` (verified in OpenAPI), but building the create-fulfillment UI with carrier/tracking/line-item selection, plus wiring existing add/update/remove line-item actions to the detail page, is a multi-component build.
- **A024** — 0.10 OpenAPI does not contain `/api/giftcards`. The nav item dead-ends. The user story explicitly requires a giftcards API that does not exist.
- **A025** — `listTaxClasses/Rates` now throw on error (fixed). The Tax screen remains display-only; building create/edit/delete forms for classes and rates requires new action functions, form components, and page mutations. Backend POST endpoints exist but UI build is multi-component.
- **A026** — `listShippingZones/Rates` now throw on error (fixed). The Shipping screen remains display-only; building create/edit/delete forms for zones and rates requires new action functions and form components. Backend POST endpoints exist but UI build is multi-component.
- **A027** — `listStaff/Roles` now throw on error (fixed). The Staff screen remains display-only; building invite-staff/assign-role forms requires new action functions and UI components. Backend has `POST /api/admin/staff/invitations` but UI build is multi-component.

## Verification
- `pnpm check-types` — green (3/3 packages)
- `pnpm build` — green (admin + storefront, backend up on :4000)
