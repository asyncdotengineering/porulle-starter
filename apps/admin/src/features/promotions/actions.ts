'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createPromotion, deactivatePromotion, type PromotionInput } from '@/lib/porulle/promotions';
import { createSaleModifier, type SaleInput } from '@/lib/porulle/pricing';

export async function createSaleAction(input: SaleInput): Promise<{ error?: string }> {
  await requireAdmin();
  if (!input.name.trim()) return { error: 'Name is required.' };
  if (!input.validUntil) return { error: 'Pick an end date.' };
  if (!Number.isFinite(input.value) || input.value <= 0) return { error: 'Enter a valid value.' };
  const result = await createSaleModifier({ ...input, name: input.name.trim() });
  if (!result.error) revalidatePath('/dashboard/promotions');
  return result;
}

export async function createPromotionAction(input: PromotionInput): Promise<{ error?: string }> {
  await requireAdmin();
  if (!input.name.trim()) return { error: 'Name is required.' };
  if (!Number.isFinite(input.value) || input.value < 0) return { error: 'Enter a valid value.' };
  const result = await createPromotion({ ...input, name: input.name.trim(), code: input.code.trim() });
  if (!result.error) revalidatePath('/dashboard/promotions');
  return result;
}

export async function deactivatePromotionAction(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await deactivatePromotion(id);
  if (!result.error) revalidatePath('/dashboard/promotions');
  return result;
}
