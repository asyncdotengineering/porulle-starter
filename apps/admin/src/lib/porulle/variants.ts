import 'server-only';
import { porulle } from './client';

export interface AdminOptionType {
  id: string;
  name: string;
  values: string[];
}

export interface AdminVariant {
  id: string;
  label: string;
  sku: string | null;
}

export interface ProductVariants {
  optionTypes: AdminOptionType[];
  variants: AdminVariant[];
}

type RawValue = { id: string; value?: string; displayValue?: string };
type RawOptionType = { id: string; name?: string; displayName?: string; values?: RawValue[] };
type RawVariant = { id: string; sku?: string | null; optionValueIds?: string[] };
type ApiResult = { data?: unknown; error?: unknown };

function errText(res: ApiResult, fallback: string): string {
  const e = res.error as { error?: { message?: string } } | undefined;
  return e?.error?.message ?? fallback;
}

export async function getVariants(entityId: string): Promise<ProductVariants> {
  const res = (await porulle.GET('/api/catalog/entities/{idOrSlug}', {
    params: { path: { idOrSlug: entityId }, query: { include: 'variants,optionTypes' } }
  } as never)) as ApiResult;
  const d = (res.data as { data?: { optionTypes?: RawOptionType[]; variants?: RawVariant[] } })?.data;
  const optionTypes = d?.optionTypes ?? [];
  const variants = d?.variants ?? [];

  // valueId -> readable label, so each variant's optionValueIds render as "S / Red".
  const labelById = new Map<string, string>();
  for (const ot of optionTypes) {
    for (const v of ot.values ?? []) labelById.set(v.id, v.displayValue ?? v.value ?? '');
  }

  return {
    optionTypes: optionTypes.map((ot) => ({
      id: ot.id,
      name: ot.displayName ?? ot.name ?? '—',
      values: (ot.values ?? []).map((v) => v.displayValue ?? v.value ?? '')
    })),
    variants: variants.map((v) => ({
      id: v.id,
      sku: v.sku ?? null,
      label: (v.optionValueIds ?? []).map((id) => labelById.get(id) ?? '?').join(' / ') || 'Default'
    }))
  };
}

export async function addOptionType(
  entityId: string,
  name: string,
  values: string[]
): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/catalog/entities/{id}/options', {
    params: { path: { id: entityId } },
    body: { name, values }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to add option.') } : {};
}

// Cartesian generation. {mode:'all'} produces every option-value combination.
export async function generateVariants(entityId: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/catalog/entities/{id}/variants/generate', {
    params: { path: { id: entityId } },
    body: { mode: 'all' }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to generate variants.') } : {};
}
