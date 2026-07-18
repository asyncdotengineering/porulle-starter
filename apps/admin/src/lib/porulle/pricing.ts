import 'server-only';
import { porulle } from './client';

export interface SaleInput {
  entityId: string; // '' = store-wide
  name: string;
  type: string;
  validUntil: string; // ISO
  value: number; // percent, or dollars for fixed_discount
}

type ApiResult = { data?: unknown; error?: unknown };

// Creates a time-boxed pricing modifier ("weekend sale"). Fixed discounts are
// cents; percentage/markup pass through. porulle exposes no list/delete yet
// (asyncdotengineering/porulle) so the required end date makes it self-expiring.
export async function createSaleModifier(input: SaleInput): Promise<{ error?: string }> {
  const value = input.type === 'fixed_discount' ? Math.round(input.value * 100) : input.value;
  const res = (await porulle.POST('/api/pricing/modifiers', {
    body: {
      name: input.name,
      type: input.type,
      value,
      validUntil: input.validUntil,
      ...(input.entityId ? { entityId: input.entityId } : {})
    }
  } as never)) as ApiResult;
  if (res.error) {
    const e = res.error as { error?: { message?: string } };
    return { error: e.error?.message ?? 'Failed to create sale.' };
  }
  return {};
}
