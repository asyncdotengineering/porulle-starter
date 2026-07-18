import 'server-only';
import { porulle } from './client';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  status: string;
}

type PorulleCategory = {
  id: string;
  metadata?: { name?: string };
  slug: string;
  status?: string;
};
type ApiResult = { data?: unknown; error?: unknown };

function errText(res: ApiResult, fallback: string): string {
  const e = res.error as { error?: { message?: string } } | undefined;
  return e?.error?.message ?? fallback;
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function humanize(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function toCategory(c: PorulleCategory): AdminCategory {
  return {
    id: c.id,
    slug: c.slug,
    name: c.metadata?.name ?? humanize(c.slug),
    status: c.status ?? 'active'
  };
}

export async function listCategories(): Promise<AdminCategory[]> {
  const res = (await porulle.GET('/api/catalog/categories', {
    params: { query: { includeArchived: true } }
  } as never)) as ApiResult;
  const rows = ((res.data as { data?: PorulleCategory[] })?.data ?? []) as PorulleCategory[];
  return rows.map(toCategory);
}

// Categories are slug-identified; the readable label lives in metadata.name.
export async function createCategory(name: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/catalog/categories', {
    body: { slug: slugify(name), metadata: { name } }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to create category.') } : {};
}

export async function archiveCategory(categoryId: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/catalog/categories/{categoryId}/archive', {
    params: { path: { categoryId } }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to archive category.') } : {};
}

export async function restoreCategory(categoryId: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/catalog/categories/{categoryId}/restore', {
    params: { path: { categoryId } }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to restore category.') } : {};
}

export async function assignCategory(entityId: string, categoryId: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/catalog/entities/{id}/categories/{categoryId}', {
    params: { path: { id: entityId, categoryId } }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to assign category.') } : {};
}

export async function unassignCategory(entityId: string, categoryId: string): Promise<{ error?: string }> {
  const res = (await porulle.DELETE('/api/catalog/entities/{id}/categories/{categoryId}', {
    params: { path: { id: entityId, categoryId } }
  } as never)) as ApiResult;
  return res.error ? { error: errText(res, 'Failed to remove category.') } : {};
}
