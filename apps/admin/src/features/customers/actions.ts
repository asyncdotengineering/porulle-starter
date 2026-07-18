'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { addCustomerNote } from '@/lib/porulle/customers';

export async function addCustomerNoteAction(id: string, notes: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!notes.trim()) return { error: 'Note is empty.' };
  const result = await addCustomerNote(id, notes.trim());
  if (!result.error) revalidatePath(`/dashboard/customers/${id}`);
  return result;
}
