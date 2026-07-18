/**
 * Provisions the admin panel: creates a porulle Better Auth admin login user and
 * mints an admin-scoped API key for privileged catalog/order management. Run once,
 * then put the printed values in apps/admin/.env.local.
 *
 * Run: pnpm --filter backend key:admin
 */
import { createServer } from "@porulle/core";
import configPromise from "../commerce.config.js";

const EMAIL = process.env.ADMIN_EMAIL ?? "admin@porulle.local";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "admin12345";

const config = await configPromise;
const { app, commerce } = (await createServer(config)) as {
  app: { request: (url: string, init?: RequestInit) => Promise<Response> };
  commerce: { auth: { api: { createApiKey: (args: { body: Record<string, unknown> }) => Promise<{ id: string; key: string }> } } };
};

async function ensureAdminUser(): Promise<string> {
  const signUp = await app.request("http://localhost/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: "Admin" }),
  });
  if (signUp.ok) {
    const data = (await signUp.json()) as { user?: { id?: string } };
    if (data.user?.id) return data.user.id;
  }
  const signIn = await app.request("http://localhost/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = (await signIn.json()) as { user?: { id?: string } };
  if (data.user?.id) return data.user.id;
  throw new Error(
    `Admin user ${EMAIL} exists with a different password. Set ADMIN_PASSWORD to it, or use a fresh ADMIN_EMAIL.`,
  );
}

const userId = await ensureAdminUser();
const result = await commerce.auth.api.createApiKey({
  body: {
    configId: "admin",
    userId,
    name: "admin-panel",
    rateLimitEnabled: false,
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
      // Store config the admin panel manages (routes guard reads + writes with
      // `<resource>:manage`).
      tax: ["manage"],
      shipping: ["manage"],
      staff: ["manage"],
      // Grant each loaded plugin's admin scope (mirror commerce.config.ts).
      // gift-cards plugin routes require `gift-cards:admin`.
      "gift-cards": ["admin"],
    },
  },
});

console.log("\n✓ Admin provisioned.\n");
console.log("  Add these to apps/admin/.env.local:\n");
console.log(`  PORULLE_API_URL="http://localhost:4000"`);
console.log(`  PORULLE_ADMIN_API_KEY="${result.key}"`);
console.log(`  ADMIN_EMAILS="${EMAIL}"`);
console.log(`  ADMIN_SESSION_SECRET="$(openssl rand -base64 32)"\n`);
console.log(`  Log in at http://localhost:3001 with:`);
console.log(`    email:    ${EMAIL}`);
console.log(`    password: ${PASSWORD}\n`);
process.exit(0);
