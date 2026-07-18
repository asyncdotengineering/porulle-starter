import type { components } from './generated/api-types';

// The base entity shape is derived from porulle's OpenAPI spec (single source of
// truth). porulle's spec does NOT model the `?include=` hydrated joins
// (attributes/pricing/variants/media) on the response, so those are declared
// here and merged onto the generated base type.
type CatalogEntityBase = components['schemas']['CatalogEntity'];

export interface PorulleAttributes {
  description: string | null;
  locale: string;
  seoDescription: string | null;
  seoTitle: string | null;
  subtitle: string | null;
  title: string;
}

export interface PorullePrice {
  amount: number; // minor units
  compareAtAmount?: number | null;
  currency: string;
  variantId?: string | null;
}

export interface PorulleVariant {
  id: string;
  optionValueIds: string[];
  sku: string | null;
  status: string;
}

export interface PorulleMedia {
  alt?: string | null;
  role: string;
  url?: string | null;
}

export interface PorulleEntityMetadata {
  featuredImage?: string;
  images?: string[];
  [key: string]: unknown;
}

export interface PorulleEntity extends Omit<CatalogEntityBase, 'metadata'> {
  attributes?: PorulleAttributes[];
  media?: PorulleMedia[];
  metadata: PorulleEntityMetadata | null;
  pricing?: PorullePrice[];
  variants?: PorulleVariant[];
}
