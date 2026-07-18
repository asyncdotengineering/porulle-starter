'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createShippingZone, updateShippingZone, deleteShippingZone, createShippingRate, updateShippingRate, deleteShippingRate, type ShippingZoneInput, type ShippingZonePatch, type ShippingRateInput, type ShippingRatePatch } from '@/lib/porulle/shipping';

export type ShippingFormState = { error?: string };

export async function saveShippingZoneAction(
  _prev: ShippingFormState,
  formData: FormData
): Promise<ShippingFormState> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const countriesRaw = String(formData.get('countries') ?? '').trim();
  if (!name) return { error: 'Name is required.' };
  if (!countriesRaw) return { error: 'At least one country code is required.' };
  const countries = countriesRaw.split(',').map((c) => c.trim()).filter(Boolean);
  if (id) {
    const patch: ShippingZonePatch = { name, countries };
    const result = await updateShippingZone(id, patch);
    if (result.error) return { error: result.error };
  } else {
    const input: ShippingZoneInput = { name, countries };
    const result = await createShippingZone(input);
    if (result.error) return { error: result.error };
  }
  revalidatePath('/dashboard/shipping');
  return {};
}

export async function removeShippingZoneAction(id: string): Promise<ShippingFormState> {
  await requireAdmin();
  const result = await deleteShippingZone(id);
  if (result.error) return { error: result.error };
  revalidatePath('/dashboard/shipping');
  return {};
}

export async function saveShippingRateAction(
  _prev: ShippingFormState,
  formData: FormData
): Promise<ShippingFormState> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const zoneId = String(formData.get('zoneId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const amount = Number(formData.get('amount') ?? 0);
  if (!zoneId) return { error: 'Zone is required.' };
  if (!name) return { error: 'Name is required.' };
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Enter a valid amount (cents).' };
  if (id) {
    const patch: ShippingRatePatch = { name, amount };
    const result = await updateShippingRate(id, patch);
    if (result.error) return { error: result.error };
  } else {
    const input: ShippingRateInput = { zoneId, name, amount };
    const result = await createShippingRate(input);
    if (result.error) return { error: result.error };
  }
  revalidatePath('/dashboard/shipping');
  return {};
}

export async function removeShippingRateAction(id: string): Promise<ShippingFormState> {
  await requireAdmin();
  const result = await deleteShippingRate(id);
  if (result.error) return { error: result.error };
  revalidatePath('/dashboard/shipping');
  return {};
}
