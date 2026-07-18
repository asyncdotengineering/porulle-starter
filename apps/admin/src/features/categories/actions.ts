'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { archiveCategory, createCategory, restoreCategory } from '@/lib/porulle/categories';

export async function createCategoryAction(name: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!name.trim()) return { error: 'Name is required.' };
  const result = await createCategory(name.trim());
  if (!result.error) revalidatePath('/dashboard/categories');
  return result;
}

export async function setCategoryArchivedAction(
  id: string,
  archived: boolean
): Promise<{ error?: string }> {
  await requireAdmin();
  const result = archived ? await archiveCategory(id) : await restoreCategory(id);
  if (!result.error) revalidatePath('/dashboard/categories');
  return result;
}
