// porulle exposes catalog facets by category, brand, price and availability. The
// storefront keeps a small provider-agnostic filter shape; advanced faceting is
// a follow-up.

export type CommerceFilterPresentation = "SWATCH" | "TEXT";

export type CommerceFilterType = "BOOLEAN" | "LIST" | "PRICE_RANGE";

export interface CommerceFilterValue {
  count: number;
  id: string;
  input: string;
  label: string;
}

export interface CommerceFilter {
  id: string;
  label: string;
  presentation?: CommerceFilterPresentation | null;
  type: CommerceFilterType;
  values: CommerceFilterValue[];
}

export interface ProductFilter {
  available?: boolean;
  brand?: string;
  category?: string;
  price?: {
    max?: number;
    min?: number;
  };
}
