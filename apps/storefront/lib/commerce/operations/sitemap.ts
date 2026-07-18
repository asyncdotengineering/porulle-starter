import { cacheLife, cacheTag } from "next/cache";

import { porulle } from "../client";
import type { PorulleCategory, PorulleEntity, PorulleListMeta } from "../types/porulle";

export type SitemapType = "COLLECTION" | "PRODUCT";

export interface SitemapResource {
  handle: string;
  updatedAt: string;
}

const PER_PAGE = 100;

function cacheTagsFor(type: SitemapType): string[] {
  return type === "PRODUCT" ? ["products"] : ["collections", "collections-index"];
}

export async function getSitemapPagesCount(type: SitemapType): Promise<number> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(...cacheTagsFor(type));

  if (type === "COLLECTION") return 1;

  const res = await porulle.GET("/api/catalog/entities", {
    params: { query: { type: "product", status: "active", page: 1, limit: 1 } },
  } as never);
  const meta = (res as { data?: { meta?: PorulleListMeta } }).data?.meta;
  const total = meta?.pagination.total ?? 0;
  return Math.max(1, Math.ceil(total / PER_PAGE));
}

export async function getSitemapPage(
  type: SitemapType,
  page: number,
): Promise<{ hasNextPage: boolean; items: SitemapResource[] }> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(...cacheTagsFor(type));

  if (type === "COLLECTION") {
    const res = await porulle.GET("/api/catalog/categories", {} as never);
    const categories = ((res as { data?: { data?: PorulleCategory[] } }).data?.data ?? []) as PorulleCategory[];
    return {
      hasNextPage: false,
      items: categories.map((c) => ({ handle: c.slug, updatedAt: new Date(0).toISOString() })),
    };
  }

  const res = await porulle.GET("/api/catalog/entities", {
    params: { query: { type: "product", status: "active", page, limit: PER_PAGE } },
  } as never);
  const data = (res as { data?: { data?: PorulleEntity[]; meta?: PorulleListMeta } }).data;
  const entities = (data?.data ?? []) as PorulleEntity[];
  const meta = data?.meta;
  return {
    hasNextPage: meta ? meta.pagination.page < meta.pagination.totalPages : false,
    items: entities.map((e) => ({ handle: e.slug, updatedAt: e.updatedAt })),
  };
}
