// Shared between the server data layer and the client manager, so it must NOT be
// server-only.
export const PROMOTION_TYPES = [
  { value: 'percentage_off_order', label: '% off order' },
  { value: 'fixed_off_order', label: '$ off order' },
  { value: 'percentage_off_item', label: '% off item' },
  { value: 'fixed_off_item', label: '$ off item' },
  { value: 'free_shipping', label: 'Free shipping' },
  { value: 'buy_x_get_y', label: 'Buy X get Y' }
] as const;

export const PERCENT_TYPES = new Set(['percentage_off_order', 'percentage_off_item']);
export const FIXED_TYPES = new Set(['fixed_off_order', 'fixed_off_item']);

// Pricing modifiers = automatic, time-boxed price adjustments (distinct from
// coupon codes). Self-expiring via validUntil.
export const SALE_TYPES = [
  { value: 'percentage_discount', label: '% off' },
  { value: 'fixed_discount', label: '$ off' },
  { value: 'markup', label: 'Markup %' }
] as const;
