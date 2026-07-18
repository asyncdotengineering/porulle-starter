import 'server-only';
import { porulle } from './client';

export interface SearchHit {
  id: string;
  slug: string;
  status: string;
  title: string;
  type: string;
}

type ApiResult = { data?: unknown; error?: unknown };

export async function searchCatalog(q: string): Promise<SearchHit[]> {
  if (!q.trim()) return [];
  const res = (await porulle.GET('/api/search', {
    params: { query: { q, limit: 8 } }
  } as never)) as ApiResult;
  const rows = ((res.data as { data?: Array<{ id: string; document?: Record<string, unknown> }> })
    ?.data ?? []) as Array<{ id: string; document?: Record<string, unknown> }>;
  return rows.map((r) => {
    const doc = r.document ?? {};
    return {
      id: String(doc.id ?? r.id),
      type: String(doc.type ?? 'product'),
      slug: String(doc.slug ?? ''),
      title: String(doc.title ?? doc.slug ?? 'Untitled'),
      status: String(doc.status ?? '')
    };
  });
}
