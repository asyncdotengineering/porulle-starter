/**
 * Mints a server-side API key the storefront uses to authenticate cart and
 * checkout writes (catalog reads are anonymous, but porulle requires auth for
 * mutations). Run once, then put the printed key in the storefront env as
 * PORULLE_STOREFRONT_API_KEY.
 *
 * On the PGlite default the backend is single-writer: stop the backend before
 * running this (it boots its own short-lived instance over the same ./.data),
 * then start the backend so it sees the new key.
 *
 * Run: pnpm --filter backend exec tsx src/create-api-key.ts
 */
import { createServer } from "@porulle/core";
import configPromise from "../commerce.config.js";

const config = await configPromise;
const { app, commerce } = (await createServer(config)) as {
  app: { request: (url: string, init?: RequestInit) => Promise<Response> };
  commerce: { auth: { api: { createApiKey: (args: { body: Record<string, unknown> }) => Promise<{ id: string; key: string }> } } };
};

async function findOrCreateOwner(): Promise<string> {
  const email = `storefront-${Date.now()}@local.dev`;
  const password = `Storefront-${Date.now()}-key`;
  const signUp = await app.request("http://localhost/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify({ email, password, name: "Storefront" }),
  });
  if (signUp.ok) {
    const data = (await signUp.json()) as { user?: { id?: string } };
    if (data.user?.id) return data.user.id;
  }
  const signIn = await app.request("http://localhost/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await signIn.json()) as { user?: { id?: string } };
  if (data.user?.id) return data.user.id;
  throw new Error("Could not create or sign in the storefront owner user.");
}

const userId = await findOrCreateOwner();
const result = await commerce.auth.api.createApiKey({
  body: {
    configId: "storefront",
    userId,
    name: "storefront",
    // The storefront server proxies all cart/checkout traffic through this one
    // key, so per-key request rate limiting must be off.
    rateLimitEnabled: false,
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
});

console.log("\n✓ Storefront API key created.\n");
console.log("  Add this to apps/storefront/.env.local:\n");
console.log(`  PORULLE_STOREFRONT_API_KEY="${result.key}"\n`);
process.exit(0);
