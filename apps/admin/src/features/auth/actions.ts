'use server';
import { redirect } from 'next/navigation';
import { signInAdmin, signOutAdmin } from '@/lib/auth';

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Email and password are required.' };

  const result = await signInAdmin(email, password);
  if (!result.ok) return { error: result.error ?? 'Sign in failed.' };
  redirect('/dashboard/overview');
}

export async function logoutAction(): Promise<void> {
  await signOutAdmin();
  redirect('/auth/sign-in');
}
