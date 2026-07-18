'use server';
import { requireAdmin } from '@/lib/auth';
import { searchCatalog, type SearchHit } from '@/lib/porulle/search';

export async function searchAction(q: string): Promise<SearchHit[]> {
  await requireAdmin();
  return searchCatalog(q);
}
