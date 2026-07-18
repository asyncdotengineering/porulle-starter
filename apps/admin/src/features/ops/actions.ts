'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { resolveCompensation, retryJob } from '@/lib/porulle/ops';

export async function retryJobAction(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await retryJob(id);
  if (!result.error) revalidatePath('/dashboard/health');
  return result;
}

export async function resolveCompensationAction(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await resolveCompensation(id);
  if (!result.error) revalidatePath('/dashboard/health');
  return result;
}
