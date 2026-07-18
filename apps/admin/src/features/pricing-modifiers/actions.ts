'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { deletePricingModifier } from '@/lib/porulle/pricing-modifiers';

export async function deletePricingModifierAction(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const ok = await deletePricingModifier(id);
  if (!ok) return { error: 'Failed to delete modifier.' };
  revalidatePath('/dashboard/pricing-modifiers');
  return {};
}
