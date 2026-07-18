// Hand-written shapes for the porulle REST responses we consume. The OpenAPI
// `paths` type (lib/commerce/generated) types conditionally-hydrated includes
// (attributes/variants/pricing/media/optionTypes) loosely, so transforms cast
// the response body to these precise shapes at the boundary.

export interface PorulleAttributes {
  description: string | null;
  locale: string;
  richDescription: Record<string, unknown> | null;
  seoDescription: string | null;
  seoTitle: string | null;
  subtitle: string | null;
  title: string;
}

export interface PorullePrice {
  amount: number; // minor units (cents)
  compareAtAmount?: number | null;
  currency: string;
  variantId?: string | null;
}

export interface PorulleOptionValue {
  displayValue: string;
  id: string;
  value: string;
}

export interface PorulleOptionType {
  displayName: string;
  id: string;
  name: string;
  values: PorulleOptionValue[];
}

export interface PorulleVariant {
  id: string;
  optionValueIds: string[];
  sku: string | null;
  status: string;
}

export interface PorulleMedia {
  alt?: string | null;
  height?: number | null;
  role: string;
  url?: string | null;
  variantId?: string | null;
  width?: number | null;
}

export interface PorulleEntityMetadata {
  featuredImage?: string;
  images?: string[];
  material?: string;
  swatches?: Record<string, string>;
  weight?: number;
  [key: string]: unknown;
}

export interface PorulleEntity {
  attributes?: PorulleAttributes[];
  createdAt: string;
  id: string;
  isVisible: boolean;
  media?: PorulleMedia[];
  metadata: PorulleEntityMetadata | null;
  optionTypes?: PorulleOptionType[];
  pricing?: PorullePrice[];
  publishedAt: string | null;
  slug: string;
  status: string;
  type: string;
  updatedAt: string;
  variants?: PorulleVariant[];
}

export interface PorulleCategory {
  id: string;
  metadata?: Record<string, unknown> | null;
  parentId?: string | null;
  slug: string;
}

export interface PorulleCartLine {
  addedAt: string;
  cartId: string;
  currency: string;
  entityId: string;
  id: string;
  notes: string | null;
  quantity: number;
  unitPriceSnapshot: number;
  variantId: string | null;
}

export interface PorulleCart {
  currency: string;
  customerId: string | null;
  id: string;
  lineItems: PorulleCartLine[];
  status: string;
}

export interface PorulleListMeta {
  pagination: { limit: number; page: number; total: number; totalPages: number };
}
