'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createBrand, deleteBrand } from '@/lib/porulle/brands';

export async function createBrandAction(name: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!name.trim()) return { error: 'Name is required.' };
  const result = await createBrand(name.trim());
  if (!result.error) revalidatePath('/dashboard/brands');
  return result;
}

export async function deleteBrandAction(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await deleteBrand(id);
  if (!result.error) revalidatePath('/dashboard/brands');
  return result;
}
