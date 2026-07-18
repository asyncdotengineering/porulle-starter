'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmAction } from '@/components/confirm-action';
import { Icons } from '@/components/icons';
import type { AdminGiftCard } from '@/lib/porulle/gift-cards';
import { CreateCardForm } from './create-card-form';
import { AdjustBalanceDialog } from './adjust-balance-dialog';
import { disableGiftCardAction } from './actions';

function money(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default';
  if (status === 'disabled') return 'secondary';
  if (status === 'exhausted') return 'outline';
  return 'secondary';
}

export function GiftCardManager({ cards: initial }: { cards: AdminGiftCard[] }) {
  const [cards, setCards] = useState(initial);

  async function handleDisable(id: string) {
    const result = await disableGiftCardAction(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'disabled' as const } : c)),
    );
    toast.success('Gift card disabled.');
  }

  return (
    <div className='flex max-w-3xl flex-col gap-6'>
      <CreateCardForm />

      <div>
        <h3 className='text-sm font-semibold mb-2'>
          Gift cards ({cards.length})
        </h3>
        <Card>
          <CardContent className='divide-border divide-y p-0'>
            {cards.length === 0 ? (
              <p className='text-muted-foreground p-4 text-sm'>No gift cards yet.</p>
            ) : (
              cards.map((c) => (
                <div key={c.id} className='flex items-center justify-between px-4 py-3'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-mono text-sm font-medium'>{c.displayCode}</span>
                      <Badge variant={statusVariant(c.status)} className='text-[10px]'>
                        {c.status}
                      </Badge>
                    </div>
                    <div className='text-muted-foreground mt-0.5 text-xs'>
                      {money(c.balance, c.currency)}
                      {c.expiresAt ? (
                        <span className='ml-2'>
                          Expires {new Date(c.expiresAt).toLocaleDateString()}
                        </span>
                      ) : null}
                      {c.recipientEmail ? (
                        <span className='ml-2'>{c.recipientEmail}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className='ml-3 flex items-center gap-1'>
                    <AdjustBalanceDialog card={c} />
                    {c.status !== 'disabled' ? (
                      <ConfirmAction
                        trigger={
                          <Button variant='ghost' size='icon' className='size-8'>
                            <Icons.close className='size-4' />
                          </Button>
                        }
                        title='Disable gift card'
                        description={`Disable ${c.displayCode}? It cannot be used after this.`}
                        confirmLabel='Disable'
                        destructive
                        onConfirm={() => handleDisable(c.id)}
                      />
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
