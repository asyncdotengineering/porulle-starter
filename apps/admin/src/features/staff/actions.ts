'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { inviteStaff, updateStaffRole, revokeStaff } from '@/lib/porulle/staff';

export type StaffFormState = { error?: string };

export async function inviteStaffAction(
  _prev: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  await requireAdmin();
  const email = String(formData.get('email') ?? '').trim();
  const role = String(formData.get('role') ?? '').trim();
  if (!email) return { error: 'Email is required.' };
  if (!role) return { error: 'Role is required.' };
  if (!email.includes('@')) return { error: 'Enter a valid email address.' };
  const result = await inviteStaff({ email, role });
  if (result.error) return { error: result.error };
  revalidatePath('/dashboard/staff');
  return {};
}

export async function changeStaffRoleAction(
  _prev: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const role = String(formData.get('role') ?? '').trim();
  if (!id) return { error: 'Staff ID is required.' };
  if (!role) return { error: 'Role is required.' };
  const result = await updateStaffRole(id, role);
  if (result.error) return { error: result.error };
  revalidatePath('/dashboard/staff');
  return {};
}

export async function removeStaffAction(id: string): Promise<StaffFormState> {
  await requireAdmin();
  const result = await revokeStaff(id);
  if (result.error) return { error: result.error };
  revalidatePath('/dashboard/staff');
  return {};
}
