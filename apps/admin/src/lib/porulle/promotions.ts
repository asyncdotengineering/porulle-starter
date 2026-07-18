import 'server-only';
import { porulle } from './client';
import { FIXED_TYPES as FIXED, PERCENT_TYPES as PERCENT } from './promotion-types';

export interface AdminPromotion {
  code: string | null;
  id: string;
  isActive: boolean;
  name: string;
  type: string;
  valueLabel: string;
}

interface PorullePromotion {
  code?: string | null;
  id: string;
  isActive?: boolean;
  name?: string;
  type: string;
  value?: number;
}

export interface PromotionInput {
  code: string;
  name: string;
  type: string;
  value: number; // percent (0-100) or dollars, by type
}

type ApiResult = { data?: unknown; error?: unknown };

function errText(res: ApiResult, fallback: string): string {
  const e = res.error as { error?: { message?: string } } | undefined;
  return e?.error?.message ?? fallback;
}

function valueLabel(type: string, value: number): string {
  if (PERCENT.has(type)) return `${value}%`;
  if (FIXED.has(type)) return `$${(value / 100).toFixed(2)}`;
  if (type === 'free_shipping') return 'Free shipping';
  return String(value);
}

// Percentages go through as-is; fixed-amount discounts are cents like every other
// money value in porulle.
function toApiValue(type: string, value: number): number {
  return FIXED.has(type) ? Math.round(value * 100) : value;
}

export async function listPromotions(): Promise<AdminPromotion[]> {
  const res = (await porulle.GET('/api/promotions', {} as never)) as ApiResult;
  const rows = ((res.data as { data?: PorullePromotion[] })?.data ?? []) as PorullePromotion[];
  return rows.map((p) => ({
    id: p.id,
    name: p.name ?? '—',
    type: p.type,
    valueLabel: valueLabel(p.type, p.value ?? 0),
    code: p.code ?? null,
    isActive: p.isActive ?? true
  }));
}

export async function createPromotion(input: PromotionInput): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/promotions', {
    body: {
      name: input.name,
      type: input.type,
      value: toApiValue(input.type, input.value),
      ...(input.code ? { code: input.code } : {}),
      isActive: true
    }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to create promotion.') } : {};
}

export async function deactivatePromotion(id: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/promotions/{id}/deactivate', {
    params: { path: { id } }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to deactivate promotion.') } : {};
}
