import 'server-only';
import { porulle } from './client';

export interface AdminStock {
  onHand: number;
  reserved: number;
}

type Level = { quantityOnHand?: number; quantityReserved?: number };
type ApiResult = { data?: unknown; error?: unknown };

// Levels are per (entity, variant, warehouse). For the product-level view we sum
// on-hand across every level porulle holds for the entity.
export async function getStock(entityId: string): Promise<AdminStock> {
  const res = (await porulle.GET('/api/inventory/levels', {
    params: { query: { entityId } }
  } as never)) as ApiResult;
  const levels = ((res.data as { data?: Level[] })?.data ?? []) as Level[];
  return {
    onHand: levels.reduce((n, l) => n + (l.quantityOnHand ?? 0), 0),
    reserved: levels.reduce((n, l) => n + (l.quantityReserved ?? 0), 0)
  };
}

const DEFAULT_LOW_THRESHOLD = 5;

export interface LowStockItem {
  entityId: string;
  onHand: number;
  threshold: number;
  title: string;
}

type LevelRow = { entityId?: string; quantityOnHand?: number; reorderThreshold?: number | null };

// Store-wide low-stock: aggregate on-hand per product across the default
// warehouse's levels and flag those at/below their reorder threshold (falling
// back to a default when none is configured).
export async function listLowStock(): Promise<LowStockItem[]> {
  const whRes = (await porulle.GET('/api/inventory/warehouses', {} as never)) as ApiResult;
  const warehouseId = ((whRes.data as { data?: { id: string }[] })?.data ?? [])[0]?.id;
  if (!warehouseId) return [];

  const [levelsRes, entRes] = await Promise.all([
    porulle.GET('/api/inventory/levels', { params: { query: { warehouseId } } } as never) as Promise<ApiResult>,
    porulle.GET('/api/catalog/entities', {
      params: { query: { type: 'product', include: 'attributes', limit: 500 } }
    } as never) as Promise<ApiResult>
  ]);

  const levels = ((levelsRes.data as { data?: LevelRow[] })?.data ?? []) as LevelRow[];
  const entities = ((entRes.data as {
    data?: { id: string; slug: string; attributes?: { title?: string }[] }[];
  })?.data ?? []) as { id: string; slug: string; attributes?: { title?: string }[] }[];
  const titleById = new Map(entities.map((e) => [e.id, e.attributes?.[0]?.title ?? e.slug]));

  const agg = new Map<string, { onHand: number; threshold: number }>();
  for (const l of levels) {
    if (!l.entityId) continue;
    const cur = agg.get(l.entityId) ?? { onHand: 0, threshold: 0 };
    cur.onHand += l.quantityOnHand ?? 0;
    cur.threshold = Math.max(cur.threshold, l.reorderThreshold ?? DEFAULT_LOW_THRESHOLD);
    agg.set(l.entityId, cur);
  }

  return [...agg.entries()]
    .filter(([, v]) => v.onHand <= v.threshold)
    .map(([entityId, v]) => ({
      entityId,
      title: titleById.get(entityId) ?? entityId.slice(0, 8),
      onHand: v.onHand,
      threshold: v.threshold
    }))
    .sort((a, b) => a.onHand - b.onHand);
}

// Sets on-hand at the default warehouse (porulle picks it when warehouseId is
// omitted). mode:'set' makes the input read as "the stock is now N".
export async function setStock(
  entityId: string,
  amount: number,
  reason: string
): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/inventory/adjust', {
    body: { entityId, mode: 'set', amount, reason }
  } as never)) as { error?: { error?: { message?: string } } };
  if (res.error) return { error: res.error.error?.message ?? 'Failed to adjust stock.' };
  return {};
}
