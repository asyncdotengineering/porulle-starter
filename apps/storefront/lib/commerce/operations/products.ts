import { cacheLife, cacheTag } from "next/cache";

import type {
  Filter,
  PageInfo,
  PriceRange,
  ProductCard,
  ProductDetails,
  ProductVariant,
  SelectedOption,
} from "@/lib/types";

import { porulle } from "../client";
import { assertOk } from "../errors";
import { transformProductCard, transformProductDetails } from "../transforms";
import type { PorulleEntity, PorulleListMeta } from "../types/porulle";
import type { ProductFilter } from "../types/filters";

const DETAIL_INCLUDE = "attributes,pricing,media,variants,optionTypes";
const CARD_INCLUDE = "attributes,pricing,media,variants,optionTypes";

type ActiveFilters = Record<string, string | string[] | undefined>;

// porulle list sort fields are createdAt|updatedAt|slug. Price/best-selling/
// relevance are not server-sortable here and fall back to newest-first.
const SORT_MAP: Record<string, string> = {
  "date-new-to-old": "createdAt:desc",
  "date-old-to-new": "createdAt:asc",
  "product-name-ascending": "slug:asc",
  "product-name-descending": "slug:desc",
};

function mapSort(sortKey?: string): string {
  return (sortKey && SORT_MAP[sortKey]) || "createdAt:desc";
}

function entityFrom(data: unknown): PorulleEntity {
  return (data as { data: PorulleEntity }).data;
}

function listFrom(data: unknown): { entities: PorulleEntity[]; meta: PorulleListMeta } {
  const d = data as { data: PorulleEntity[]; meta: PorulleListMeta };
  return { entities: d.data, meta: d.meta };
}

function pageInfoFrom(meta: PorulleListMeta): PageInfo {
  const { page, totalPages } = meta.pagination;
  return {
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    startCursor: String(page),
    endCursor: page < totalPages ? String(page + 1) : null,
  };
}

function cursorToPage(cursor?: string): number {
  const n = cursor ? Number(cursor) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

async function fetchEntityBySlug(slug: string): Promise<PorulleEntity | undefined> {
  const res = await porulle.GET("/api/catalog/entities/{idOrSlug}", {
    params: { path: { idOrSlug: slug }, query: { include: DETAIL_INCLUDE } },
  } as never);
  if ((res as { error?: unknown }).error) return undefined;
  const entity = entityFrom((res as { data: unknown }).data);
  return entity ?? undefined;
}

interface ListParams {
  category?: string;
  cursor?: string;
  limit?: number;
  query?: string;
  sortKey?: string;
}

const EMPTY_PAGE_INFO: PageInfo = {
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null,
  endCursor: null,
};

// /api/catalog/entities/{id} per id, preserving the input order. Used to hydrate
// search hits (the search index returns ids + a doc, not full catalog entities).
async function fetchEntitiesByIds(ids: string[]): Promise<PorulleEntity[]> {
  if (ids.length === 0) return [];
  const fetched = await Promise.all(
    ids.map(async (id) => {
      const res = await porulle.GET("/api/catalog/entities/{idOrSlug}", {
        params: { path: { idOrSlug: id }, query: { include: CARD_INCLUDE } },
      } as never);
      if ((res as { error?: unknown }).error) return undefined;
      return entityFrom((res as { data: unknown }).data);
    }),
  );
  const byId = new Map(fetched.filter((e): e is PorulleEntity => Boolean(e)).map((e) => [e.id, e]));
  return ids.map((id) => byId.get(id)).filter((e): e is PorulleEntity => Boolean(e));
}

interface SearchMeta {
  limit: number;
  page: number;
  total: number;
}

interface SearchHit {
  id: string;
  score: number;
  document: {
    id: string;
    slug: string;
    title: string;
    categories?: string[];
    brands?: string[];
    payload?: {
      metadata?: {
        images?: string[];
        featuredImage?: string;
        swatches?: Record<string, string>;
      };
    };
  };
}

interface SearchResponse {
  data: SearchHit[];
  meta?: SearchMeta & {
    facets?: Record<string, Record<string, number>>;
  };
}

async function searchProducts(params: ListParams): Promise<{ products: ProductCard[]; pageInfo: PageInfo; total: number }> {
  const page = cursorToPage(params.cursor);
  const limit = params.limit ?? 24;
  const query: Record<string, string | number> = { q: params.query ?? "", type: "product", page, limit };
  if (params.category) query.category = params.category;

  const res = await porulle.GET("/api/search", { params: { query } } as never);
  if ((res as { error?: unknown }).error) return { products: [], pageInfo: EMPTY_PAGE_INFO, total: 0 };

  const d = (res as { data: SearchResponse }).data;
  const entities = await fetchEntitiesByIds(d.data.map((hit) => hit.id));
  const total = d.meta?.total ?? entities.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    products: entities.map(transformProductCard),
    pageInfo: {
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      startCursor: String(page),
      endCursor: page < totalPages ? String(page + 1) : null,
    },
    total,
  };
}

async function searchProductsWithFacets(params: ListParams): Promise<{
  products: ProductCard[];
  pageInfo: PageInfo;
  total: number;
  filters: Filter[];
}> {
  const page = cursorToPage(params.cursor);
  const limit = params.limit ?? 24;
  const query: Record<string, string | number> = {
    q: params.query ?? "",
    type: "product",
    page,
    limit,
    facets: "category,brand",
  };
  if (params.category) query.category = params.category;

  const res = await porulle.GET("/api/search", { params: { query } } as never);
  if ((res as { error?: unknown }).error) return { products: [], pageInfo: EMPTY_PAGE_INFO, total: 0, filters: [] };

  const d = (res as { data: SearchResponse }).data;
  const entities = await fetchEntitiesByIds(d.data.map((hit) => hit.id));
  const total = d.meta?.total ?? entities.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rawFacets = d.meta?.facets ?? {};
  const filters: Filter[] = [];

  const categoryFacet = rawFacets.category;
  if (categoryFacet && Object.keys(categoryFacet).length > 0) {
    filters.push({
      id: "category",
      label: "Category",
      paramKey: "category",
      type: "list",
      values: Object.entries(categoryFacet).map(([slug, count]) => ({
        id: slug,
        label: slug.charAt(0).toUpperCase() + slug.slice(1),
        value: slug,
        count,
      })),
    });
  }

  const brandFacet = rawFacets.brand;
  if (brandFacet && Object.keys(brandFacet).length > 0) {
    filters.push({
      id: "brand",
      label: "Brand",
      paramKey: "brand",
      type: "list",
      values: Object.entries(brandFacet).map(([slug, count]) => ({
        id: slug,
        label: slug,
        value: slug,
        count,
      })),
    });
  }

  return {
    products: entities.map(transformProductCard),
    pageInfo: {
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      startCursor: String(page),
      endCursor: page < totalPages ? String(page + 1) : null,
    },
    total,
    filters,
  };
}

export async function searchProductCards(query: string, limit: number): Promise<ProductCard[]> {
  const { products } = await searchProducts({ query, limit });
  return products;
}

async function listProducts(params: ListParams): Promise<{ products: ProductCard[]; pageInfo: PageInfo; total: number }> {
  if (params.query) return searchProducts(params);

  const page = cursorToPage(params.cursor);
  const query: Record<string, string | number> = {
    type: "product",
    status: "active",
    include: CARD_INCLUDE,
    sort: mapSort(params.sortKey),
    page,
    limit: params.limit ?? 24,
  };
  if (params.category) query.category = params.category;

  const res = await porulle.GET("/api/catalog/entities", { params: { query } } as never);
  assertOk(res as never, "listProducts");
  const { entities, meta } = listFrom((res as { data: unknown }).data);
  return {
    products: entities.map(transformProductCard),
    pageInfo: meta ? pageInfoFrom(meta) : EMPTY_PAGE_INFO,
    total: meta?.pagination.total ?? entities.length,
  };
}

export async function getProduct({ handle }: { handle: string; locale?: string }): Promise<ProductDetails | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${handle}`);
  const entity = await fetchEntityBySlug(handle);
  return entity ? transformProductDetails(entity) : undefined;
}

export async function getProductWithVariants(args: { handle: string; locale?: string }): Promise<ProductDetails | undefined> {
  return getProduct(args);
}

export async function getProductById({ id }: { id: string; locale?: string }): Promise<ProductDetails | undefined> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");
  const res = await porulle.GET("/api/catalog/entities/{idOrSlug}", {
    params: { path: { idOrSlug: id }, query: { include: DETAIL_INCLUDE } },
  } as never);
  if ((res as { error?: unknown }).error) return undefined;
  const entity = entityFrom((res as { data: unknown }).data);
  return entity ? transformProductDetails(entity) : undefined;
}

function matchVariant(product: ProductDetails, selectedOptions: SelectedOption[]): ProductVariant | undefined {
  if (!product.variants?.length) return undefined;
  if (selectedOptions.length === 0) {
    return product.variants.find((v) => v.availableForSale) ?? product.variants[0];
  }
  const match = product.variants.find((v) =>
    selectedOptions.every((sel) =>
      v.selectedOptions.some(
        (o) => o.name.toLowerCase() === sel.name.toLowerCase() && o.value.toLowerCase() === sel.value.toLowerCase(),
      ),
    ),
  );
  return match ?? product.variants.find((v) => v.availableForSale) ?? product.variants[0];
}

export async function getProductVariant({
  handle,
  selectedOptions,
}: {
  handle: string;
  locale?: string;
  selectedOptions: SelectedOption[];
}): Promise<ProductVariant | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${handle}`);
  const entity = await fetchEntityBySlug(handle);
  if (!entity) return undefined;
  return matchVariant(transformProductDetails(entity), selectedOptions);
}

export async function getProductsByHandles({ handles }: { handles: string[]; locale?: string }): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");
  if (handles.length === 0) return [];
  const entities = await Promise.all(handles.map(fetchEntityBySlug));
  return entities.filter((e): e is PorulleEntity => e !== undefined).map(transformProductCard);
}

export async function getProductsByIds({ ids }: { ids: string[]; locale?: string }): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");
  if (ids.length === 0) return [];
  const cards = await Promise.all(ids.map((id) => getProductById({ id })));
  return cards.filter((c): c is ProductDetails => c !== undefined).map((p) => p as ProductCard);
}

type CatalogProductsResult = { pageInfo: PageInfo; products: ProductCard[] };

export async function getCatalogProducts(params: { limit?: number; locale?: string }): Promise<CatalogProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");
  const { products, pageInfo } = await listProducts({ limit: params.limit });
  return { products, pageInfo };
}

export async function getFilteredCatalogProducts(params: {
  collection?: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: string;
  query?: string;
  sortKey?: string;
}): Promise<CatalogProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");
  const { products, pageInfo } = await listProducts({
    category: params.collection,
    cursor: params.cursor,
    limit: params.limit,
    query: params.query,
    sortKey: params.sortKey,
  });
  return { products, pageInfo };
}

type CollectionProductsResult = {
  filters: Filter[];
  pageInfo: PageInfo;
  priceRange?: PriceRange;
  products: ProductCard[];
};

export async function fetchCollectionProducts(params: {
  activeFilters?: ActiveFilters;
  collection: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: string;
  sortKey?: string;
}): Promise<CollectionProductsResult> {
  const { products, pageInfo, filters } = await searchProductsWithFacets({
    category: params.collection,
    cursor: params.cursor,
    limit: params.limit,
    sortKey: params.sortKey,
  });
  return { filters, pageInfo, products };
}

export async function getCollectionProducts(params: {
  activeFilters?: ActiveFilters;
  collection: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: string;
  sortKey?: string;
}): Promise<CollectionProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", "collections", `collection-${params.collection}`);
  return fetchCollectionProducts(params);
}

type SearchIndexProductsResult = { pageInfo: PageInfo; products: ProductCard[]; total: number };

export async function fetchSearchIndexProducts(params: {
  collection?: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: string;
  query?: string;
  sortKey?: string;
}): Promise<SearchIndexProductsResult> {
  return listProducts({
    category: params.collection,
    cursor: params.cursor,
    limit: params.limit,
    query: params.query,
    sortKey: params.sortKey,
  });
}

export async function searchIndexProducts(params: {
  collection?: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: string;
  query?: string;
  sortKey?: string;
}): Promise<SearchIndexProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");
  return fetchSearchIndexProducts(params);
}

type SearchFacetsResult = { filters: Filter[]; priceRange?: PriceRange; total: number };

export async function fetchSearchFacets(params: {
  activeFilters?: ActiveFilters;
  collection?: string;
  filters?: ProductFilter[];
  locale?: string;
  query?: string;
}): Promise<SearchFacetsResult> {
  const { filters, total } = await searchProductsWithFacets({
    category: params.collection,
    query: params.query,
    limit: 1,
  });
  return { filters, total };
}

export async function getSearchFacets(params: {
  activeFilters?: ActiveFilters;
  collection?: string;
  filters?: ProductFilter[];
  locale?: string;
  query?: string;
}): Promise<SearchFacetsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");
  return fetchSearchFacets(params);
}

export interface ProductRecommendationSets {
  complementary: ProductCard[];
  related: ProductCard[];
}

export async function getProductRecommendationSets({
  handle,
}: {
  handle: string;
  locale?: string;
}): Promise<ProductRecommendationSets> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `recommendations-${handle}`);
  // Recommend other in-catalog products, excluding the current one.
  const { products } = await listProducts({ limit: 8 });
  const related = products.filter((p) => p.handle !== handle).slice(0, 4);
  return { complementary: [], related };
}

export function buildProductFiltersFromParams(searchParams: Record<string, string | string[] | undefined>): ProductFilter[] {
  const filters: ProductFilter[] = [];
  const min = numeric(searchParams["filter.v.price.gte"]);
  const max = numeric(searchParams["filter.v.price.lte"]);
  if (min !== undefined || max !== undefined) {
    filters.push({ price: { ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) } });
  }
  const availability = single(searchParams["filter.v.availability"]);
  if (availability !== undefined) filters.push({ available: availability === "1" });
  return filters;
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function numeric(value: string | string[] | undefined): number | undefined {
  const v = single(value);
  if (v === undefined) return undefined;
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? undefined : n;
}
