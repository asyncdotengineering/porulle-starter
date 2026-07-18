'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import type { PricingModifier } from '@/lib/porulle/pricing-modifiers';
import { ConfirmAction } from '@/components/confirm-action';
import { deletePricingModifierAction } from './actions';

export function PricingModifiersManager({ modifiers }: { modifiers: PricingModifier[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function remove(m: PricingModifier) {
    setDeletingId(m.id);
    startTransition(async () => {
      const result = await deletePricingModifierAction(m.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Deleted ${m.name}`);
        router.refresh();
      }
      setDeletingId(null);
    });
  }

  const deleteTrigger = (m: PricingModifier) => (
    <Button
      variant='ghost'
      size='icon'
      className='size-8'
      disabled={pending && deletingId === m.id}
    >
      <Icons.trash className='size-4' />
      <span className='sr-only'>Delete</span>
    </Button>
  );

  return (
    <div className='flex max-w-3xl flex-col gap-4'>
      <Card>
        <CardContent className='divide-border divide-y p-0'>
          {modifiers.length === 0 ? (
            <p className='text-muted-foreground p-4 text-sm'>No pricing modifiers yet.</p>
          ) : (
            modifiers.map((m) => (
              <div key={m.id} className='flex items-center justify-between px-4 py-3'>
                <div>
                  <div className='font-medium'>{m.name}</div>
                  <div className='text-muted-foreground text-xs'>
                    {m.type} · {m.amount} {m.currency}
                    {m.validFrom || m.validUntil ? ` · ${m.validFrom ?? 'now'} → ${m.validUntil ?? '∞'}` : ''}
                    {!m.isActive && ' · inactive'}
                  </div>
                </div>
                <ConfirmAction
                  trigger={deleteTrigger(m)}
                  title='Delete pricing modifier'
                  description={`Are you sure you want to delete "${m.name}"? This action is irreversible.`}
                  confirmLabel='Delete'
                  destructive
                  onConfirm={async () => remove(m)}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
