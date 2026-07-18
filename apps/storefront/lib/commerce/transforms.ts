import type {
  Cart,
  CartLine,
  Collection,
  Image,
  Money,
  ProductCard,
  ProductDetails,
  ProductOption,
  ProductVariant,
  SelectedOption,
} from "@/lib/types";

import type {
  PorulleCart,
  PorulleEntity,
  PorulleOptionType,
  PorullePrice,
  PorulleVariant,
} from "./types/porulle";

const DEFAULT_CURRENCY = "USD";
const MERCH_SEP = "::";

// The storefront models "merchandise" as a single id; porulle keys line items by
// (entityId, variantId). We bridge by encoding both into the merchandise id.
export function encodeMerchandiseId(entityId: string, variantId?: string | null): string {
  return variantId ? `${entityId}${MERCH_SEP}${variantId}` : entityId;
}

export function decodeMerchandiseId(id: string): { entityId: string; variantId?: string } {
  const [entityId, variantId] = id.split(MERCH_SEP);
  return variantId ? { entityId, variantId } : { entityId };
}

export function toMoney(amountCents: number, currency = DEFAULT_CURRENCY): Money {
  return { amount: (amountCents / 100).toFixed(2), currencyCode: currency };
}

function parseImage(url: string, altText: string): Image {
  const match = url.match(/\/(\d{2,5})\/(\d{2,5})(?:\.\w+)?(?:\?|$)/);
  return {
    url,
    altText,
    width: match ? Number(match[1]) : 800,
    height: match ? Number(match[2]) : 1000,
  };
}

function entityImages(entity: PorulleEntity): Image[] {
  // Prefer uploaded media assets; fall back to seeded metadata image URLs.
  const title = entityTitle(entity);
  const media = (entity.media ?? [])
    .filter((m) => m.url && (m.role === "primary" || m.role === "gallery" || m.role === "thumbnail"))
    .map((m) => ({
      url: m.url!,
      altText: m.alt ?? title,
      width: m.width ?? 800,
      height: m.height ?? 1000,
    }));
  if (media.length > 0) return media;
  const urls = entity.metadata?.images ?? [];
  return urls.map((u) => parseImage(u, title));
}

function entityTitle(entity: PorulleEntity): string {
  return entity.attributes?.[0]?.title ?? entity.slug;
}

function priceRange(pricing: PorullePrice[] | undefined, currency: string): {
  min: Money;
  max: Money;
  compareAtMin?: Money;
} {
  const amounts = (pricing ?? []).map((p) => p.amount).filter((n) => typeof n === "number");
  const min = amounts.length ? Math.min(...amounts) : 0;
  const max = amounts.length ? Math.max(...amounts) : 0;
  const compareAt = (pricing ?? [])
    .map((p) => p.compareAtAmount)
    .filter((n): n is number => typeof n === "number" && n > 0);
  return {
    min: toMoney(min, currency),
    max: toMoney(max, currency),
    ...(compareAt.length ? { compareAtMin: toMoney(Math.min(...compareAt), currency) } : {}),
  };
}

function entityCurrency(entity: PorulleEntity): string {
  return entity.pricing?.[0]?.currency ?? DEFAULT_CURRENCY;
}

// optionValueId → { optionName, value }
function optionValueLookup(optionTypes: PorulleOptionType[] | undefined): Map<string, SelectedOption> {
  const map = new Map<string, SelectedOption>();
  for (const ot of optionTypes ?? []) {
    for (const v of ot.values) {
      map.set(v.id, { name: ot.name, value: v.value });
    }
  }
  return map;
}

function variantSelectedOptions(
  variant: PorulleVariant,
  lookup: Map<string, SelectedOption>,
): SelectedOption[] {
  return variant.optionValueIds
    .map((id) => lookup.get(id))
    .filter((o): o is SelectedOption => o !== undefined);
}

function variantTitle(selected: SelectedOption[]): string {
  return selected.length ? selected.map((o) => o.value).join(" / ") : "Default Title";
}

function transformVariant(
  entity: PorulleEntity,
  variant: PorulleVariant,
  lookup: Map<string, SelectedOption>,
  currency: string,
): ProductVariant {
  const selectedOptions = variantSelectedOptions(variant, lookup);
  const variantPrice = entity.pricing?.find((p) => p.variantId === variant.id);
  const basePrice = entity.pricing?.find((p) => !p.variantId) ?? entity.pricing?.[0];
  const amount = variantPrice?.amount ?? basePrice?.amount ?? 0;
  return {
    id: encodeMerchandiseId(entity.id, variant.id),
    title: variantTitle(selectedOptions),
    availableForSale: variant.status === "active",
    price: toMoney(amount, currency),
    selectedOptions,
    image: null,
    bundleParents: [],
    components: [],
    requiresComponents: false,
  };
}

function transformOptions(entity: PorulleEntity): ProductOption[] {
  const swatches = entity.metadata?.swatches ?? {};
  return (entity.optionTypes ?? []).map((ot) => ({
    id: ot.id,
    name: ot.name,
    values: ot.values.map((v) => ({
      id: v.id,
      name: v.value,
      ...(swatches[v.value] ? { swatch: { color: swatches[v.value] } } : {}),
    })),
  }));
}

export function transformProductCard(entity: PorulleEntity): ProductCard {
  const currency = entityCurrency(entity);
  const { min, max, compareAtMin } = priceRange(entity.pricing, currency);
  const images = entityImages(entity);
  const lookup = optionValueLookup(entity.optionTypes);
  const firstVariant = entity.variants?.[0];
  return {
    id: entity.id,
    handle: entity.slug,
    title: entityTitle(entity),
    featuredImage: images[0] ?? null,
    price: min,
    maxPrice: max,
    ...(compareAtMin ? { compareAtPrice: compareAtMin } : {}),
    availableForSale: entity.status === "active",
    defaultVariantId: encodeMerchandiseId(entity.id, firstVariant?.id),
    defaultVariantSelectedOptions: firstVariant
      ? variantSelectedOptions(firstVariant, lookup)
      : [],
  };
}

export function transformProductDetails(entity: PorulleEntity): ProductDetails {
  const currency = entityCurrency(entity);
  const { min, max, compareAtMin } = priceRange(entity.pricing, currency);
  const images = entityImages(entity);
  const lookup = optionValueLookup(entity.optionTypes);
  const attrs = entity.attributes?.[0];
  const description = attrs?.description ?? "";
  const title = entityTitle(entity);
  let variants = (entity.variants ?? []).map((v) => transformVariant(entity, v, lookup, currency));
  // Variant-free (single-SKU) product: synthesize one default variant from the
  // entity itself so it is purchasable with no option selection (Shopify's
  // "Default Title" pattern). The cart accepts an entity with no variantId, and
  // OptionPicker hides the synthetic "Title / Default Title" option.
  if (variants.length === 0) {
    variants = [
      {
        id: encodeMerchandiseId(entity.id, undefined),
        title: "Default Title",
        availableForSale: entity.status === "active",
        price: min,
        selectedOptions: [{ name: "Title", value: "Default Title" }],
        image: null,
        bundleParents: [],
        components: [],
        requiresComponents: false,
      },
    ];
  }
  const defaultVariant = variants.find((v) => v.availableForSale) ?? variants[0];
  const options = transformOptions(entity);

  const metafields: ProductDetails["metafields"] = [];
  if (entity.metadata?.material) {
    metafields.push({ key: "material", label: "Material", value: String(entity.metadata.material) });
  }
  if (entity.metadata?.weight) {
    metafields.push({ key: "weight", label: "Weight", value: `${entity.metadata.weight} g` });
  }

  return {
    id: entity.id,
    handle: entity.slug,
    title,
    featuredImage: images[0] ?? null,
    price: min,
    maxPrice: max,
    ...(compareAtMin ? { compareAtPrice: compareAtMin } : {}),
    availableForSale: entity.status === "active",
    defaultVariant,
    defaultVariantId: defaultVariant?.id,
    defaultVariantSelectedOptions: defaultVariant?.selectedOptions ?? [],
    allVariantsInStock: true,
    hasUniformPricing: min.amount === max.amount,
    variantsCount: variants.length,
    description,
    descriptionHtml: description ? `<p>${escapeHtml(description)}</p>` : "",
    images,
    videos: [],
    options,
    variants,
    tags: [],
    seo: {
      title: attrs?.seoTitle || title,
      description: attrs?.seoDescription || description,
    },
    category: null,
    collectionHandles: [],
    currencyCode: currency,
    manufacturerName: "",
    metafields,
    priceRange: { minVariantPrice: min, maxVariantPrice: max },
    ...(compareAtMin
      ? { compareAtPriceRange: { minVariantPrice: compareAtMin, maxVariantPrice: compareAtMin } }
      : {}),
    updatedAt: entity.updatedAt,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function transformCollection(category: { slug: string; metadata?: Record<string, unknown> | null }): Collection {
  const title = titleCase(category.slug);
  const description =
    typeof category.metadata?.description === "string" ? category.metadata.description : "";
  return {
    handle: category.slug,
    title,
    description,
    image: null,
    path: `/collections/${category.slug}`,
    updatedAt: new Date(0).toISOString(),
    seo: { title, description: description || title },
  };
}

function titleCase(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Builds storefront cart lines. porulle line items carry only ids + quantity, so
// each line's product detail is hydrated by the caller and passed in via `byEntity`.
export function transformCart(cart: PorulleCart, byEntity: Map<string, ProductDetails>): Cart {
  const currency = cart.currency ?? DEFAULT_CURRENCY;
  const lines: CartLine[] = cart.lineItems.map((li) => {
    const product = byEntity.get(li.entityId);
    const variant = product?.variants?.find(
      (v) => decodeMerchandiseId(v.id).variantId === (li.variantId ?? undefined),
    );
    const selectedOptions = variant?.selectedOptions ?? [];
    const image = product?.featuredImage ?? undefined;
    const lineTotal = li.unitPriceSnapshot * li.quantity;
    return {
      canRemove: true,
      canUpdateQuantity: true,
      components: [],
      cost: { totalAmount: toMoney(lineTotal, currency) },
      discountAllocations: [],
      id: li.id,
      merchandise: {
        id: encodeMerchandiseId(li.entityId, li.variantId),
        ...(image ? { image } : {}),
        price: toMoney(li.unitPriceSnapshot, currency),
        product: {
          featuredImage: product?.featuredImage ?? { url: "", altText: "", width: 0, height: 0 },
          handle: product?.handle ?? "",
          id: li.entityId,
          title: product?.title ?? "Product",
        },
        selectedOptions,
        title: variant?.title ?? "Default Title",
      },
      quantity: li.quantity,
    };
  });

  const subtotal = cart.lineItems.reduce((sum, li) => sum + li.unitPriceSnapshot * li.quantity, 0);
  const totalQuantity = cart.lineItems.reduce((sum, li) => sum + li.quantity, 0);

  return {
    appliedGiftCards: [],
    checkoutUrl: "/checkout",
    cost: { subtotalAmount: toMoney(subtotal, currency), totalAmount: toMoney(subtotal, currency) },
    discountAllocations: [],
    discountCodes: [],
    id: cart.id,
    lines,
    note: null,
    shippingCost: null,
    totalQuantity,
  };
}
