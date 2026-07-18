'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import {
  createGiftCard,
  disableGiftCard,
  adjustGiftCard,
  type GiftCardCreateInput,
  type GiftCardAdjustInput,
} from '@/lib/porulle/gift-cards';

export type GiftCardActionState = { error?: string };

export async function createGiftCardAction(
  _prev: GiftCardActionState,
  formData: FormData,
): Promise<GiftCardActionState> {
  await requireAdmin();

  const amount = Number(formData.get('amount'));
  const currency = String(formData.get('currency') ?? 'USD').trim();
  const recipientEmail = String(formData.get('recipientEmail') ?? '').trim() || undefined;
  const senderName = String(formData.get('senderName') ?? '').trim() || undefined;
  const personalMessage = String(formData.get('personalMessage') ?? '').trim() || undefined;

  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter a valid positive amount.' };
  if (!currency || currency.length !== 3) return { error: 'Currency required (3-letter code).' };

  const input: GiftCardCreateInput = { amount: Math.round(amount), currency };
  if (recipientEmail) input.recipientEmail = recipientEmail;
  if (senderName) input.senderName = senderName;
  if (personalMessage) input.personalMessage = personalMessage;

  const result = await createGiftCard(input);
  if (result.error) return { error: result.error };

  revalidatePath('/dashboard/gift-cards');
  redirect('/dashboard/gift-cards');
}

export async function disableGiftCardAction(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await disableGiftCard(id);
  if (result.error) return { error: result.error };
  revalidatePath('/dashboard/gift-cards');
  return {};
}

export async function adjustGiftCardAction(
  _prev: GiftCardActionState,
  formData: FormData,
): Promise<GiftCardActionState> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '').trim();
  const delta = Number(formData.get('delta'));
  const note = String(formData.get('note') ?? '').trim();

  if (!id) return { error: 'Card ID is required.' };
  if (!Number.isFinite(delta) || delta === 0) return { error: 'Enter a non-zero adjustment amount.' };
  if (!note) return { error: 'Reason for adjustment is required.' };

  const input: GiftCardAdjustInput = { delta: Math.round(delta), note };
  const result = await adjustGiftCard(id, input);
  if (result.error) return { error: result.error };

  revalidatePath('/dashboard/gift-cards');
  redirect('/dashboard/gift-cards');
}
