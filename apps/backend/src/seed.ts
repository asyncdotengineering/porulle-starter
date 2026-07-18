/**
 * Seed script — populates the database with a small streetwear catalog so the
 * storefront has real products, variants, prices, and stock to render.
 *
 * Run: pnpm --filter backend seed   (after `pnpm --filter backend db:push`)
 *
 * Uses the kernel directly (in-process, no HTTP) so it can run before the
 * server is up. Product imagery is carried as URLs in entity `metadata.images`
 * (a starter simplification) — wire the media module to serve uploaded assets
 * in production.
 */
import {
  createKernel,
  ensureDefaultOrg,
  DEFAULT_ORG_ID,
  type Actor,
} from "@porulle/core";
import configPromise from "../commerce.config.js";

const config = await configPromise;
const kernel = createKernel(config);

const staff: Actor = {
  type: "user",
  userId: "seed-admin",
  email: "admin@porulle-starter.test",
  name: "Seed Admin",
  vendorId: null,
  organizationId: DEFAULT_ORG_ID,
  role: "owner",
  permissions: ["*:*"],
};

const SWATCHES: Record<string, string> = {
  Black: "#1a1a1a",
  White: "#f5f5f5",
  Olive: "#5b6240",
  Sand: "#c2b280",
  Navy: "#1f2a44",
  Charcoal: "#36454f",
};

function img(slug: string, n: number): string {
  return `https://picsum.photos/seed/${slug}-${n}/900/1100`;
}

interface SeedProduct {
  slug: string;
  title: string;
  description: string;
  category: "tops" | "bottoms" | "accessories";
  price: number; // minor units (cents)
  material: string;
  weight: number;
  stock: number;
  colors?: string[];
  sizes?: string[];
}

const PRODUCTS: SeedProduct[] = [
  {
    slug: "classic-logo-tee",
    title: "Classic Logo Tee",
    description: "Signature 240gsm organic cotton tee with a clean chest logo. Pre-shrunk, built to last.",
    category: "tops",
    price: 2900,
    material: "Organic Cotton",
    weight: 200,
    stock: 80,
    colors: ["Black", "White", "Sand"],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    slug: "oversized-hoodie",
    title: "Oversized Heavyweight Hoodie",
    description: "Relaxed-fit 450gsm fleece hoodie with a double-lined hood and ribbed cuffs.",
    category: "tops",
    price: 7900,
    material: "Cotton Blend",
    weight: 650,
    stock: 50,
    colors: ["Black", "Olive", "Charcoal"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    slug: "boxy-longsleeve",
    title: "Boxy Long Sleeve",
    description: "A boxy long-sleeve in midweight jersey. Drop shoulders, ribbed collar.",
    category: "tops",
    price: 4200,
    material: "Combed Cotton",
    weight: 280,
    stock: 60,
    colors: ["White", "Navy"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    slug: "utility-cargo-pants",
    title: "Utility Cargo Pants",
    description: "Six-pocket ripstop cargos with an adjustable hem and roomy thigh pockets.",
    category: "bottoms",
    price: 8900,
    material: "Ripstop Nylon",
    weight: 520,
    stock: 40,
    sizes: ["28", "30", "32", "34", "36"],
  },
  {
    slug: "relaxed-denim",
    title: "Relaxed Selvedge Denim",
    description: "14oz selvedge denim cut with a relaxed straight leg. Raw, ages beautifully.",
    category: "bottoms",
    price: 11900,
    material: "Selvedge Denim",
    weight: 700,
    stock: 30,
    sizes: ["28", "30", "32", "34", "36"],
  },
  {
    slug: "ribbed-knit-beanie",
    title: "Ribbed Knit Beanie",
    description: "Chunky ribbed beanie in soft merino wool. Warm without the bulk.",
    category: "accessories",
    price: 2400,
    material: "Merino Wool",
    weight: 90,
    stock: 120,
    colors: ["Black", "Olive", "Sand", "Navy"],
  },
  {
    slug: "crossbody-sling-bag",
    title: "Crossbody Sling Bag",
    description: "Compact, water-resistant sling with a magnetic buckle and hidden back pocket.",
    category: "accessories",
    price: 5400,
    material: "Cordura Nylon",
    weight: 300,
    stock: 35,
  },
  {
    slug: "six-panel-cap",
    title: "Six-Panel Cap",
    description: "Unstructured six-panel cap in washed cotton twill with a curved brim.",
    category: "accessories",
    price: 3200,
    material: "Washed Cotton",
    weight: 110,
    stock: 90,
  },
];

function unwrap<T>(r: { ok: true; value: T } | { ok: false; error: unknown }, label: string): T {
  if (!r.ok) {
    console.error(`✗ ${label}:`, r.error);
    process.exit(1);
  }
  return r.value;
}

async function seed() {
  await ensureDefaultOrg(kernel.database.db);
  console.log("🌱 Seeding Porulle Starter catalog...\n");

  // Categories
  const categoryIds: Record<string, string> = {};
  for (const slug of ["tops", "bottoms", "accessories"]) {
    const cat = unwrap(await kernel.services.catalog.createCategory({ slug }, staff), `category ${slug}`);
    categoryIds[slug] = cat.id;
  }
  console.log(`  ✓ categories: tops, bottoms, accessories`);

  // Warehouse
  const warehouse = unwrap(
    await kernel.services.inventory.createWarehouse({ name: "Main Warehouse", code: "MAIN" }, staff),
    "warehouse",
  );
  console.log(`  ✓ warehouse: ${warehouse.name}\n`);

  for (const p of PRODUCTS) {
    const entity = unwrap(
      await kernel.services.catalog.create(
        {
          type: "product",
          slug: p.slug,
          attributes: {
            title: p.title,
            description: p.description,
            seoTitle: p.title,
            seoDescription: p.description,
          },
          metadata: {
            images: [img(p.slug, 1), img(p.slug, 2), img(p.slug, 3)],
            featuredImage: img(p.slug, 1),
            material: p.material,
            weight: p.weight,
            ...(p.colors ? { swatches: Object.fromEntries(p.colors.map((c) => [c, SWATCHES[c] ?? "#888"])) } : {}),
          },
        },
        staff,
      ),
      `product ${p.slug}`,
    );

    // Options + variants (size/color matrix)
    if (p.colors) {
      unwrap(
        await kernel.services.catalog.createOptionType({ entityId: entity.id, name: "Color", values: p.colors }, staff),
        `option Color ${p.slug}`,
      );
    }
    if (p.sizes) {
      unwrap(
        await kernel.services.catalog.createOptionType({ entityId: entity.id, name: "Size", values: p.sizes }, staff),
        `option Size ${p.slug}`,
      );
    }
    let variantIds: string[] = [];
    if (p.colors || p.sizes) {
      const generated = unwrap(
        await kernel.services.catalog.generateVariants(entity.id, { mode: "all" }, staff),
        `variants ${p.slug}`,
      );
      variantIds = generated.map((v) => v.id);
    }

    await kernel.services.catalog.publish(entity.id, staff);
    await kernel.services.catalog.addToCategory(entity.id, categoryIds[p.category]!, staff);
    unwrap(
      await kernel.services.pricing.setBasePrice({ entityId: entity.id, currency: "USD", amount: p.price }, staff),
      `price ${p.slug}`,
    );
    // Stock and price are tracked per (entity, variant). Set both per variant
    // for variant products; the entity directly for single-variant products.
    if (variantIds.length) {
      for (const variantId of variantIds) {
        await kernel.services.pricing.setBasePrice(
          { entityId: entity.id, variantId, currency: "USD", amount: p.price },
          staff,
        );
        await kernel.services.inventory.adjust(
          { entityId: entity.id, variantId, warehouseId: warehouse.id, adjustment: p.stock, reason: "initial_stock" },
          staff,
        );
      }
    } else {
      await kernel.services.inventory.adjust(
        { entityId: entity.id, warehouseId: warehouse.id, adjustment: p.stock, reason: "initial_stock" },
        staff,
      );
    }

    const variantNote = p.colors || p.sizes ? ` (${(p.colors?.length ?? 1) * (p.sizes?.length ?? 1)} variants)` : "";
    console.log(`  ✓ ${p.title.padEnd(30)} $${(p.price / 100).toFixed(2).padStart(7)}  stock ${String(p.stock).padStart(3)}${variantNote}`);
  }

  console.log("\n✅ Seed complete. Start the backend with: pnpm --filter backend dev\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
