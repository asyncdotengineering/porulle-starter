'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminGiftCard } from '@/lib/porulle/gift-cards';
import { adjustGiftCardAction } from './actions';

function money(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function AdjustBalanceDialog({ card }: { card: AdminGiftCard }) {
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData();
    fd.set('id', card.id);
    fd.set('delta', delta);
    fd.set('note', note);
    const result = await adjustGiftCardAction({}, fd);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setDelta('');
    setNote('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' className='text-xs'>
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust balance — {card.displayCode}</DialogTitle>
          <DialogDescription>
            Current balance: {money(card.balance, card.currency)}.
            Positive values credit, negative values debit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <input type='hidden' name='id' value={card.id} />
          <div className='grid gap-2'>
            <Label htmlFor='adj-delta'>Adjustment (cents)</Label>
            <Input
              id='adj-delta'
              name='delta'
              type='number'
              placeholder='-1000'
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='adj-note'>Reason</Label>
            <Input
              id='adj-note'
              name='note'
              placeholder='Customer service credit'
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </div>
          {error ? <p className='text-destructive text-sm'>{error}</p> : null}
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type='submit' disabled={pending}>
              {pending ? 'Adjusting…' : 'Adjust balance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
