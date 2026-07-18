'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createTaxClass, updateTaxClass, deleteTaxClass, createTaxRate, updateTaxRate, deleteTaxRate, type TaxClassInput, type TaxClassPatch, type TaxRateInput, type TaxRatePatch } from '@/lib/porulle/tax';

export type TaxFormState = { error?: string };

export async function saveTaxClassAction(
  _prev: TaxFormState,
  formData: FormData
): Promise<TaxFormState> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const rateBps = Number(formData.get('rateBps') ?? 0);
  const isDefault = formData.get('isDefault') === 'on';
  if (!name) return { error: 'Name is required.' };
  if (!Number.isFinite(rateBps) || rateBps < 0) return { error: 'Enter a valid rate (basis points).' };
  if (id) {
    const patch: TaxClassPatch = { name, rateBps, isDefault };
    const result = await updateTaxClass(id, patch);
    if (result.error) return { error: result.error };
  } else {
    const input: TaxClassInput = { name, rateBps, isDefault };
    const result = await createTaxClass(input);
    if (result.error) return { error: result.error };
  }
  revalidatePath('/dashboard/tax');
  return {};
}

export async function removeTaxClassAction(id: string): Promise<TaxFormState> {
  await requireAdmin();
  const result = await deleteTaxClass(id);
  if (result.error) return { error: result.error };
  revalidatePath('/dashboard/tax');
  return {};
}

export async function saveTaxRateAction(
  _prev: TaxFormState,
  formData: FormData
): Promise<TaxFormState> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  const rateBps = Number(formData.get('rateBps') ?? 0);
  if (!name) return { error: 'Name is required.' };
  if (!country) return { error: 'Country code is required (ISO 3166-1 alpha-2).' };
  if (!Number.isFinite(rateBps) || rateBps < 0) return { error: 'Enter a valid rate (basis points).' };
  if (id) {
    const patch: TaxRatePatch = { name, country, rateBps };
    patch.state = state || null;
    const result = await updateTaxRate(id, patch);
    if (result.error) return { error: result.error };
  } else {
    const input: TaxRateInput = { name, country, rateBps };
    if (state) input.state = state;
    const result = await createTaxRate(input);
    if (result.error) return { error: result.error };
  }
  revalidatePath('/dashboard/tax');
  return {};
}

export async function removeTaxRateAction(id: string): Promise<TaxFormState> {
  await requireAdmin();
  const result = await deleteTaxRate(id);
  if (result.error) return { error: result.error };
  revalidatePath('/dashboard/tax');
  return {};
}
