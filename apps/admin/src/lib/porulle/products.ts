import 'server-only';
import { porulle } from './client';
import type { PorulleEntity } from './types';

const INCLUDE = 'attributes,media,variants';
const CURRENCY = 'USD';

export interface AdminProduct {
  createdAt: string;
  currency: string;
  description: string;
  id: string;
  image: string | null;
  isVisible: boolean;
  priceAmount: number; // minor units
  priceLabel: string;
  slug: string;
  status: string;
  title: string;
  variantCount: number;
}

export interface ProductInput {
  description: string;
  price: number; // dollars
  publish: boolean;
  slug: string;
  title: string;
}

function money(cents: number, currency = CURRENCY): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function firstImage(entity: PorulleEntity): string | null {
  const media = (entity.media ?? []).find((m) => m.url);
  if (media?.url) return media.url;
  return entity.metadata?.featuredImage ?? entity.metadata?.images?.[0] ?? null;
}

type PriceRecord = {
  amount: number;
  createdAt: string;
  currency: string;
  customerGroupId: string | null;
  maxQuantity: number | null;
  minQuantity: number | null;
  variantId: string | null;
};

// The entity `?include=pricing` join is lossy (no variantId/createdAt). To show
// what checkout actually charges we read full price records and mirror the
// resolver: among plain base prices (no variant/group/qty), the most recently
// created wins. porulle 0.7.0 makes setBasePrice upsert (one row per key), but
// this also correctly resolves any legacy duplicate rows.
async function effectiveBasePrice(entityId: string): Promise<{ amount: number; currency: string } | null> {
  const res = (await porulle.GET('/api/pricing/prices', {
    params: { query: { entityId, currency: CURRENCY } }
  } as never)) as ApiResult;
  const prices = ((res.data as { data?: { prices?: PriceRecord[] } })?.data?.prices ?? []) as PriceRecord[];
  const base = prices.filter(
    (p) => !p.variantId && !p.customerGroupId && p.minQuantity == null && p.maxQuantity == null
  );
  if (base.length === 0) return null;
  base.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { amount: base[0].amount, currency: base[0].currency };
}

// The effective base price in minor units (0 if none) — used to prefill manual
// order line items.
export async function getProductPrice(entityId: string): Promise<number> {
  return (await effectiveBasePrice(entityId))?.amount ?? 0;
}

function transform(entity: PorulleEntity, price: { amount: number; currency: string } | null): AdminProduct {
  const amount = price?.amount ?? 0;
  const currency = price?.currency ?? CURRENCY;
  const attrs = entity.attributes?.[0];
  return {
    id: entity.id,
    slug: entity.slug,
    title: attrs?.title ?? entity.slug,
    description: attrs?.description ?? '',
    status: entity.status,
    isVisible: entity.isVisible,
    priceAmount: amount,
    currency,
    priceLabel: money(amount, currency),
    image: firstImage(entity),
    variantCount: entity.variants?.length ?? 0,
    createdAt: entity.createdAt
  };
}

type ApiResult = { data?: unknown; error?: unknown };

export async function listProducts(): Promise<AdminProduct[]> {
  const res = (await porulle.GET('/api/catalog/entities', {
    params: { query: { type: 'product', include: INCLUDE, limit: 100, sort: 'createdAt:desc' } }
  } as never)) as ApiResult;
  const entities = ((res.data as { data?: PorulleEntity[] })?.data ?? []) as PorulleEntity[];
  return Promise.all(
    entities.map(async (e) => transform(e, await effectiveBasePrice(e.id)))
  );
}

export async function getProduct(idOrSlug: string): Promise<AdminProduct | null> {
  const res = (await porulle.GET('/api/catalog/entities/{idOrSlug}', {
    params: { path: { idOrSlug }, query: { include: INCLUDE } }
  } as never)) as ApiResult;
  if (res.error) return null;
  const entity = (res.data as { data?: PorulleEntity })?.data;
  if (!entity) return null;
  return transform(entity, await effectiveBasePrice(entity.id));
}

export async function getProductOrganization(
  entityId: string
): Promise<{ brandId: string | null; categoryIds: string[] }> {
  const res = (await porulle.GET('/api/catalog/entities/{idOrSlug}', {
    params: { path: { idOrSlug: entityId }, query: { include: 'brands,categories' } }
  } as never)) as ApiResult;
  const entity = (res.data as {
    data?: { brands?: { brandId: string }[]; categories?: { categoryId: string }[] };
  })?.data;
  return {
    brandId: entity?.brands?.[0]?.brandId ?? null,
    categoryIds: (entity?.categories ?? []).map((c) => c.categoryId)
  };
}

function errText(res: ApiResult, fallback: string): string {
  const e = res.error as { error?: { message?: string } } | undefined;
  return e?.error?.message ?? fallback;
}

export async function createProduct(input: ProductInput): Promise<{ error?: string; id?: string }> {
  const create = (await porulle.POST('/api/catalog/entities', {
    body: {
      type: 'product',
      slug: input.slug,
      attributes: { title: input.title, description: input.description }
    }
  } as never)) as ApiResult;
  const entity = (create.data as { data?: { id: string } })?.data;
  if (create.error || !entity) return { error: errText(create, 'Failed to create product.') };

  await porulle.POST('/api/pricing/prices', {
    body: { entityId: entity.id, currency: CURRENCY, amount: Math.round(input.price * 100) }
  } as never);

  await setStatus(entity.id, input.publish ? 'active' : 'draft');
  return { id: entity.id };
}

export async function updateProduct(id: string, input: ProductInput): Promise<{ error?: string }> {
  const attrs = (await porulle.PUT('/api/catalog/entities/{id}/attributes/{locale}', {
    params: { path: { id, locale: 'en' } },
    body: { title: input.title, description: input.description }
  } as never)) as ApiResult;
  if (attrs.error) return { error: errText(attrs, 'Failed to update product.') };

  // Skip the price write when the amount is unchanged (avoids a redundant
  // setBasePrice call on a title-only edit).
  const desired = Math.round(input.price * 100);
  const current = await effectiveBasePrice(id);
  if (current?.amount !== desired) {
    await porulle.POST('/api/pricing/prices', {
      body: { entityId: id, currency: CURRENCY, amount: desired }
    } as never);
  }

  await setStatus(id, input.publish ? 'active' : 'archived');
  return {};
}

export async function archiveProduct(id: string): Promise<{ error?: string }> {
  const res = await setStatus(id, 'archived');
  return res.error ? { error: errText(res, 'Failed to archive product.') } : {};
}

// Images are stored in metadata.featuredImage — the same field the seed and
// storefront read — so a single source drives display everywhere. porulle's
// entity update REPLACES the metadata jsonb, so we read-merge-write to avoid
// clobbering sibling metadata (weight/material/etc).
export async function setFeaturedImage(id: string, url: string): Promise<{ error?: string }> {
  const cur = (await porulle.GET('/api/catalog/entities/{idOrSlug}', {
    params: { path: { idOrSlug: id } }
  } as never)) as ApiResult;
  const meta = ((cur.data as { data?: { metadata?: Record<string, unknown> } })?.data?.metadata ??
    {}) as Record<string, unknown>;
  const images = Array.isArray(meta.images) ? (meta.images as string[]) : [];
  const res = (await porulle.PATCH('/api/catalog/entities/{id}', {
    params: { path: { id } },
    body: { metadata: { ...meta, featuredImage: url, images: [url, ...images.filter((u) => u !== url)] } }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to set product image.') } : {};
}

// A single PATCH status transition (authorized by catalog:update) covers
// publish/archive/draft, rather than the separate /publish + /archive routes.
function setStatus(id: string, status: 'active' | 'archived' | 'draft'): Promise<ApiResult> {
  return porulle.PATCH('/api/catalog/entities/{id}', {
    params: { path: { id } },
    body: { status }
  } as never) as Promise<ApiResult>;
}
