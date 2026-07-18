import { cacheLife, cacheTag } from "next/cache";

import type { Collection, CollectionWithThumbnail } from "@/lib/types";

import { porulle } from "../client";
import { transformProductCard, transformCollection } from "../transforms";
import type { PorulleCategory, PorulleEntity } from "../types/porulle";

async function fetchCategories(): Promise<PorulleCategory[]> {
  const res = await porulle.GET("/api/catalog/categories", {} as never);
  if ((res as { error?: unknown }).error) return [];
  return ((res as { data: { data: PorulleCategory[] } }).data.data ?? []) as PorulleCategory[];
}

export async function getCollections(params?: { limit?: number; locale?: string }): Promise<Collection[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", "collections-index");
  const categories = await fetchCategories();
  const collections = categories.map(transformCollection);
  return params?.limit ? collections.slice(0, params.limit) : collections;
}

export async function getCollection({ handle }: { handle: string; locale?: string }): Promise<Collection | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("collections", `collection-${handle}`);
  const categories = await fetchCategories();
  const category = categories.find((c) => c.slug === handle);
  return category ? transformCollection(category) : undefined;
}

export async function getCollectionsListing(_params?: { locale?: string }): Promise<CollectionWithThumbnail[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", "collections-index", "products");
  const categories = await fetchCategories();
  return Promise.all(
    categories.map(async (category) => {
      const collection = transformCollection(category);
      const res = await porulle.GET("/api/catalog/entities", {
        params: { query: { type: "product", status: "active", category: category.slug, limit: 1, include: "attributes,media,pricing" } },
      } as never);
      const first = ((res as { data?: { data?: PorulleEntity[] } }).data?.data ?? [])[0];
      const thumbnail = first ? transformProductCard(first).featuredImage : null;
      return { ...collection, thumbnail };
    }),
  );
}
