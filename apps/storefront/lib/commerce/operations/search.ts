import type { PredictiveSearchProduct, PredictiveSearchResult } from "@/lib/types";

import { searchProductCards } from "./products";

export async function predictiveSearch({
  query,
  limit = 6,
}: {
  query: string;
  limit?: number;
  locale?: string;
}): Promise<PredictiveSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { collections: [], products: [], queries: [] };

  const cards = await searchProductCards(trimmed, limit);
  const products: PredictiveSearchProduct[] = cards.map((card) => ({
    id: card.id,
    handle: card.handle,
    title: card.title,
    featuredImage: card.featuredImage,
    price: card.price,
    availableForSale: card.availableForSale,
    ...(card.compareAtPrice ? { compareAtPrice: card.compareAtPrice } : {}),
  }));

  return { collections: [], products, queries: [] };
}
