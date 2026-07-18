/// <reference types="node" />
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./node_modules/@porulle/core/src/**/schema.ts",
    "./node_modules/@porulle/core/src/auth/auth-schema.ts",
    // Plugin tables (Postgres mode). PGlite creates these at boot.
    "./node_modules/@porulle/plugin-giftcards/src/schema.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/porulle_starter",
  },
});
