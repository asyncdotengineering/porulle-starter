'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction, type LoginState } from '@/features/auth/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type='submit' className='w-full' disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

export default function SignInViewPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <div className='w-full max-w-sm space-y-6'>
        <div className='space-y-2 text-center'>
          <div className='bg-primary text-primary-foreground mx-auto flex size-10 items-center justify-center rounded-lg text-sm font-semibold'>
            P
          </div>
          <h1 className='text-2xl font-semibold tracking-tight'>Porulle Admin</h1>
          <p className='text-muted-foreground text-sm'>Sign in to manage your store.</p>
        </div>
        <form action={formAction} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' name='email' type='email' autoComplete='email' required />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <Input id='password' name='password' type='password' autoComplete='current-password' required />
          </div>
          {state.error ? <p className='text-destructive text-sm'>{state.error}</p> : null}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
