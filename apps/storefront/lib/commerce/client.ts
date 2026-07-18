import "server-only";
import { createClient } from "@porulle/sdk";

import type { paths } from "./generated/api-types";

const PORULLE_API_URL = process.env.PORULLE_API_URL ?? "http://localhost:4000";
// Storefront-scoped server key (prefix pk_porulle_), minted by `pnpm key:create`.
// NOT the admin key — the admin key deliberately lacks cart permissions, so
// using it here 403s every cart/checkout write.
const PORULLE_STOREFRONT_API_KEY = process.env.PORULLE_STOREFRONT_API_KEY;

// Public catalog/search reads are anonymous — no key attached, so they never
// consume the storefront key's rate budget.
export const porulle = createClient<paths>({ baseUrl: PORULLE_API_URL });

// Cart and checkout are mutations (and cart reads are owner-scoped), which
// porulle requires authentication for. They go through this keyed client.
// Falls back to the anonymous client when no key is set (dev-only; writes 403).
export const porulleWrite = PORULLE_STOREFRONT_API_KEY
  ? createClient<paths>({
      baseUrl: PORULLE_API_URL,
      auth: { type: "api_key" as const, key: PORULLE_STOREFRONT_API_KEY },
    })
  : porulle;

export const porulleApiUrl = PORULLE_API_URL;
