'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PROMOTION_TYPES } from '@/lib/porulle/promotion-types';
import type { AdminPromotion } from '@/lib/porulle/promotions';
import { ConfirmAction } from '@/components/confirm-action';
import { createPromotionAction, deactivatePromotionAction } from './actions';

const selectClass =
  'border-input bg-background h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

export function PromotionsManager({ promotions }: { promotions: AdminPromotion[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(PROMOTION_TYPES[0].value);
  const [value, setValue] = useState('10');
  const [code, setCode] = useState('');
  const [pending, startTransition] = useTransition();

  const needsValue = type !== 'free_shipping';

  function create() {
    startTransition(async () => {
      const result = await createPromotionAction({ name, type, value: Number(value), code });
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Created ${name}`);
        setName('');
        setCode('');
        router.refresh();
      }
    });
  }

  function deactivate(p: AdminPromotion) {
    startTransition(async () => {
      const result = await deactivatePromotionAction(p.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Deactivated ${p.name}`);
        router.refresh();
      }
    });
  }

  const deactivateTrigger = (p: AdminPromotion) => (
    <Button variant='ghost' size='sm' disabled={pending}>
      Deactivate
    </Button>
  );

  return (
    <div className='flex max-w-3xl flex-col gap-6'>
      <Card>
        <CardContent className='flex flex-wrap items-end gap-3 pt-6'>
          <div className='grid gap-1.5'>
            <Label htmlFor='promo-name'>Name</Label>
            <Input id='promo-name' value={name} onChange={(e) => setName(e.target.value)} className='w-48' />
          </div>
          <div className='grid gap-1.5'>
            <Label htmlFor='promo-type'>Type</Label>
            <select
              id='promo-type'
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={cn(selectClass, 'w-40')}
            >
              {PROMOTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {needsValue ? (
            <div className='grid gap-1.5'>
              <Label htmlFor='promo-value'>Value</Label>
              <Input
                id='promo-value'
                type='number'
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className='w-24'
              />
            </div>
          ) : null}
          <div className='grid gap-1.5'>
            <Label htmlFor='promo-code'>Code (optional)</Label>
            <Input id='promo-code' value={code} onChange={(e) => setCode(e.target.value)} className='w-32' />
          </div>
          <Button disabled={pending || !name.trim()} onClick={create}>
            Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='divide-border divide-y p-0'>
          {promotions.length === 0 ? (
            <p className='text-muted-foreground p-4 text-sm'>No promotions yet.</p>
          ) : (
            promotions.map((p) => (
              <div key={p.id} className='flex items-center justify-between px-4 py-3'>
                <div className='flex items-center gap-3'>
                  <span className='font-medium'>{p.name}</span>
                  <span className='text-muted-foreground text-sm'>{p.valueLabel}</span>
                  {p.code ? (
                    <Badge variant='outline' className='font-mono'>
                      {p.code}
                    </Badge>
                  ) : null}
                  <Badge
                    variant='outline'
                    className={cn(
                      p.isActive
                        ? 'border-transparent bg-green-500/15 text-green-700 dark:text-green-400'
                        : 'border-transparent bg-muted text-muted-foreground'
                    )}
                  >
                    {p.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {p.isActive ? (
                  <ConfirmAction
                    trigger={deactivateTrigger(p)}
                    title='Deactivate promotion'
                    description={`Are you sure you want to deactivate "${p.name}"? Customers will no longer be able to use this promotion.`}
                    confirmLabel='Deactivate'
                    destructive
                    onConfirm={async () => deactivate(p)}
                  />
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
