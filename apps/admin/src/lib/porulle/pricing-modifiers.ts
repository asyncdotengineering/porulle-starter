import 'server-only';
import { porulle } from './client';

export interface PricingModifier {
  id: string;
  name: string;
  type: string;
  amount: number;
  entityId?: string | null;
  currency: string;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function listPricingModifiers(): Promise<PricingModifier[]> {
  const res = await porulle.GET('/api/pricing/modifiers', {} as never);
  if ((res as { error?: unknown }).error) {
    throw new Error('Failed to load pricing modifiers.');
  }
  const items = (res as { data?: { data?: Array<{
    id: string;
    name: string;
    type: string;
    amount: number;
    entityId?: string | null;
    currency: string;
    validFrom?: string | null;
    validUntil?: string | null;
    isActive?: boolean;
    createdAt: string;
  }> } }).data?.data ?? [];

  return items.map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    amount: m.amount,
    entityId: m.entityId ?? null,
    currency: m.currency,
    validFrom: m.validFrom ?? null,
    validUntil: m.validUntil ?? null,
    isActive: m.isActive ?? true,
    createdAt: m.createdAt,
  }));
}

export async function deletePricingModifier(id: string): Promise<boolean> {
  const res = await porulle.DELETE('/api/pricing/modifiers/{id}', {
    params: { path: { id } },
  } as never);
  return !(res as { error?: unknown }).error;
}
