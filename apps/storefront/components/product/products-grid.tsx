import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import type { Locale } from "@/lib/i18n";
import { searchIndexProducts } from "@/lib/commerce/operations/products";
import { cn } from "@/lib/utils";

interface ProductsGridSkeletonProps {
  count: number;
  className?: string;
}

export function ProductsGridSkeleton({ count, className }: ProductsGridSkeletonProps) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-accent rounded w-48 animate-pulse" />
        <div className="h-4 bg-accent rounded w-20 animate-pulse" />
      </div>
      <div className={cn("grid grid-cols-2 gap-5 lg:grid-cols-4", className)}>
        {Array.from({ length: count }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

interface ProductsGridProps {
  collectionUrl?: string;
  limit: number;
  locale: Locale;
  title: string;
}

export async function ProductsGrid({ collectionUrl, limit, locale, title }: ProductsGridProps) {
  const t = await getTranslations("product");

  return (
    <Suspense fallback={<ProductsGridSkeleton count={limit} />}>
      <ProductsGridContent
        limit={limit}
        locale={locale}
        title={title}
        collectionUrl={collectionUrl}
        outOfStockText={t("outOfStock")}
      />
    </Suspense>
  );
}

async function ProductsGridContent({
  limit,
  locale,
  title,
  collectionUrl,
  outOfStockText,
}: {
  limit: number;
  locale: Locale;
  title: string;
  collectionUrl?: string;
  outOfStockText: string;
}) {
  // Use the search index (not the products connection) so these match the first items on /collections/all.
  const { products } = await searchIndexProducts({ limit, locale });

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <p className="text-muted-foreground">No products available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter">{title}</h2>
        {collectionUrl && (
          <Link
            href={collectionUrl}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            outOfStockText={outOfStockText}
          />
        ))}
      </div>
    </div>
  );
}
