'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createGiftCardAction, type GiftCardActionState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type='submit' disabled={pending}>
      {pending ? 'Issuing…' : 'Issue gift card'}
    </Button>
  );
}

export function CreateCardForm() {
  const [state, formAction] = useActionState<GiftCardActionState, FormData>(createGiftCardAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Issue a gift card</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='gc-amount'>Amount (cents)</Label>
              <Input
                id='gc-amount'
                name='amount'
                type='number'
                min='1'
                placeholder='5000'
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='gc-currency'>Currency</Label>
              <Input
                id='gc-currency'
                name='currency'
                defaultValue='USD'
                maxLength={3}
                minLength={3}
                required
              />
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='gc-email'>Recipient email (optional)</Label>
            <Input id='gc-email' name='recipientEmail' type='email' placeholder='customer@example.com' />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='gc-sender'>Sender name (optional)</Label>
            <Input id='gc-sender' name='senderName' placeholder='Your Store' />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='gc-message'>Personal message (optional)</Label>
            <Input id='gc-message' name='personalMessage' placeholder='Enjoy your gift!' />
          </div>
          {state.error ? <p className='text-destructive text-sm'>{state.error}</p> : null}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
