import 'server-only';
import { porulle } from './client';

export interface AdminBrand {
  displayName: string;
  id: string;
  slug: string;
}

type ApiResult = { data?: unknown; error?: unknown };

function errText(res: ApiResult, fallback: string): string {
  const e = res.error as { error?: { message?: string } } | undefined;
  return e?.error?.message ?? fallback;
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function listBrands(): Promise<AdminBrand[]> {
  const res = (await porulle.GET('/api/catalog/brands', {} as never)) as ApiResult;
  const rows = ((res.data as { data?: AdminBrand[] })?.data ?? []) as AdminBrand[];
  return rows.map((b) => ({ id: b.id, slug: b.slug, displayName: b.displayName ?? b.slug }));
}

export async function createBrand(displayName: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/catalog/brands', {
    body: { displayName, slug: slugify(displayName) }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to create brand.') } : {};
}

export async function deleteBrand(brandId: string): Promise<{ error?: string }> {
  const res = (await porulle.DELETE('/api/catalog/brands/{brandId}', {
    params: { path: { brandId } }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to delete brand.') } : {};
}

export async function assignBrand(entityId: string, brandId: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/catalog/entities/{id}/brands/{brandId}', {
    params: { path: { id: entityId, brandId } }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to assign brand.') } : {};
}

export async function unassignBrand(entityId: string, brandId: string): Promise<{ error?: string }> {
  const res = (await porulle.DELETE('/api/catalog/entities/{id}/brands/{brandId}', {
    params: { path: { id: entityId, brandId } }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to remove brand.') } : {};
}
