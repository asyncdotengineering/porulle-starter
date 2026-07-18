import { defineConfig, Ok, type PaymentAdapter } from "@porulle/core";
import { postgresAdapter } from "@porulle/adapter-postgres";
import { pgliteAdapter } from "@porulle/adapter-pglite";
import { localStorageAdapter } from "@porulle/adapter-local-storage";
import { stripePayment } from "@porulle/adapter-stripe";
import { giftCardPluginWithHooks } from "@porulle/plugin-giftcards";

const DATABASE_URL = process.env.DATABASE_URL;

// Canonical https origin in production. Used for Better Auth CSRF/cookie checks
// and as the public prefix for uploaded media. Defaults to localhost for dev.
const PUBLIC_URL = process.env.PUBLIC_URL ?? "http://localhost:4000";

// The storefront origin — added to trustedOrigins so browser-originated auth
// requests (sign-in cookies) are accepted. Server-to-server SDK calls from the
// storefront are not subject to this, but customer auth in the browser is.
const STOREFRONT_URL =
  process.env.STOREFRONT_URL ?? "http://localhost:3000";

// The admin panel origin — added to trustedOrigins for its Better Auth login.
const ADMIN_URL = process.env.ADMIN_URL ?? "http://localhost:3001";

// Stripe is the production payment gateway. When STRIPE_SECRET_KEY is absent
// (first run, before keys are added) we fall back to a dev-only mock so the
// checkout pipeline still returns a client secret and the flow is walkable.
const stripeSecret = process.env.STRIPE_SECRET_KEY;

const devMockPayments: PaymentAdapter = {
  providerId: "stripe",
  async createPaymentIntent({ amount, currency }) {
    const id = `pi_dev_${amount}_${currency}`;
    return Ok({
      id,
      status: "requires_payment_method",
      amount,
      currency,
      clientSecret: `${id}_secret_dev`,
    });
  },
  async capturePayment(paymentIntentId, amount) {
    return Ok({ id: paymentIntentId, status: "succeeded", amountCaptured: amount ?? 0 });
  },
  async refundPayment(_paymentId, amount) {
    return Ok({ id: `re_dev_${Date.now()}`, status: "succeeded", amountRefunded: amount });
  },
  async cancelPaymentIntent() {
    return Ok(undefined);
  },
  async verifyWebhook() {
    return Ok({ id: "evt_dev", type: "payment_intent.succeeded", data: {} });
  },
};

const payments: PaymentAdapter[] = stripeSecret
  ? [
      stripePayment({
        secretKey: stripeSecret,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      }),
    ]
  : [devMockPayments];

if (!stripeSecret) {
  console.warn(
    "[porulle] STRIPE_SECRET_KEY not set — using a dev mock payment adapter. " +
      "Set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET to enable real Stripe.",
  );
}

const databaseAdapter = DATABASE_URL
  ? postgresAdapter({
      connectionString: DATABASE_URL,
      pool: { pooled: !DATABASE_URL.includes("localhost") },
    })
  : await pgliteAdapter({ path: "./.data/pgdata" });

if (!DATABASE_URL) {
  console.warn(
    "[porulle] DATABASE_URL not set — using PGlite (embedded Postgres) for zero-infra dev. " +
      "Data lives in ./.data/pgdata. Set DATABASE_URL to use a real Postgres server.",
  );
}

export default defineConfig({
  storeName: process.env.STORE_NAME ?? "Porulle Starter",
  version: "1.0.0",

  database: { provider: "postgresql" },
  databaseAdapter,

  storage: localStorageAdapter({
    basePath: "./.data/media",
    baseUrl: `${PUBLIC_URL}/assets`,
  }),

  auth: {
    requireEmailVerification: false,
    // B2C single-storefront: every customer falls into the store's default org.
    defaultOrganizationId: "org_default",
    apiKeys: { enabled: true, defaultPermissions: ["catalog:read", "orders:read"] },
    // The storefront authenticates cart/checkout writes with a server-side key
    // minted under this scope (src/create-api-key.ts). Catalog reads stay public.
    apiKeyScopes: {
      storefront: {
        prefix: "pk_porulle_",
        description: "Storefront server key — catalog reads + cart/checkout writes.",
        permissions: {
          catalog: ["read"],
          cart: ["create", "read", "update"],
          orders: ["create", "read"],
          search: ["read"],
          pricing: ["read"],
          inventory: ["read"],
          promotions: ["read"],
        },
      },
      admin: {
        prefix: "pk_admin_",
        description: "Admin panel server key — full catalog/inventory/orders/pricing management.",
        permissions: {
          catalog: ["read", "create", "update", "delete", "manage"],
          inventory: ["read", "adjust", "manage"],
          orders: ["read", "create", "update", "manage"],
          pricing: ["read", "manage"],
          promotions: ["read", "manage"],
          customers: ["read", "update", "manage"],
          search: ["read"],
          media: ["read", "write"],
          jobs: ["admin"],
          compensation: ["admin"],
          // Store-config surfaces the admin panel manages. Their routes guard
          // BOTH reads and writes with `<resource>:manage`, so without these the
          // admin key 403s on tax/shipping/staff entirely.
          tax: ["manage"],
          shipping: ["manage"],
          staff: ["manage"],
          // Each loaded plugin that guards routes with its own permission scope
          // must be granted here (and in src/create-admin.ts). The gift-cards
          // plugin's admin routes require `gift-cards:admin`; without this grant
          // the admin key gets 403 on /api/gift-cards.
          "gift-cards": ["admin"],
        },
      },
    },
    trustedOrigins: [PUBLIC_URL, STOREFRONT_URL, ADMIN_URL],
  },

  entities: {
    product: {
      fields: [
        { name: "weight", type: "number", unit: "grams" },
        { name: "material", type: "text" },
      ],
      variants: { enabled: true, optionTypes: ["Color", "Size"] },
      fulfillment: "physical",
    },
  },

  shipping: {
    type: "flat",
    flatRate: 500,
    freeShippingThreshold: 10000,
    fallbackCost: 500,
    brackets: [],
  },

  payments,

  // Gift cards: admin CRUD (/api/gift-cards), storefront balance-check, and
  // checkout deduction + refund credit hooks. On the PGlite default the tables
  // are created at boot; on Postgres run `pnpm db:push` (schema is wired into
  // drizzle.config.ts).
  plugins: [giftCardPluginWithHooks()],

  // porulle leaves cart pricing policy to the adopter: cart `addItem` snapshots
  // whatever `unitPriceSnapshot` the input carries (defaulting to 1000 cents).
  // This hook resolves the catalog price for the (entity, variant) and stamps it,
  // so cart/checkout totals reflect the real price.
  hooks: {
    "cart.beforeAddItem": [
      (async (args: unknown) => {
        const { data, context } = args as {
          data: { currency?: string; entityId: string; quantity: number; unitPriceSnapshot?: number; variantId?: string | null };
          context: { actor: unknown; services: { pricing: { resolve: (input: unknown, actor?: unknown) => Promise<{ ok: boolean; value?: { finalAmount: number } }> } } };
        };
        if (data.unitPriceSnapshot != null) return data;
        const resolved = await context.services.pricing.resolve(
          {
            entityId: data.entityId,
            variantId: data.variantId ?? undefined,
            currency: data.currency ?? "USD",
            quantity: data.quantity ?? 1,
          },
          context.actor,
        );
        if (resolved.ok && resolved.value) {
          return { ...data, unitPriceSnapshot: resolved.value.finalAmount };
        }
        return data;
      }) as (...args: unknown[]) => unknown,
    ],
  },
});
