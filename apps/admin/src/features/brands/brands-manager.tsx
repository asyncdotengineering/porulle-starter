'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import type { AdminBrand } from '@/lib/porulle/brands';
import { ConfirmAction } from '@/components/confirm-action';
import { createBrandAction, deleteBrandAction } from './actions';

export function BrandsManager({ brands }: { brands: AdminBrand[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pending, startTransition] = useTransition();

  function create() {
    startTransition(async () => {
      const result = await createBrandAction(name);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Added ${name}`);
        setName('');
        router.refresh();
      }
    });
  }

  function remove(b: AdminBrand) {
    startTransition(async () => {
      const result = await deleteBrandAction(b.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Deleted ${b.displayName}`);
        router.refresh();
      }
    });
  }

  const deleteTrigger = (b: AdminBrand) => (
    <Button
      variant='ghost'
      size='icon'
      className='size-8'
      disabled={pending}
    >
      <Icons.trash className='size-4' />
      <span className='sr-only'>Delete</span>
    </Button>
  );

  return (
    <div className='flex max-w-2xl flex-col gap-4'>
      <div className='flex gap-2'>
        <Input
          placeholder='New brand name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && create()}
        />
        <Button disabled={pending || !name.trim()} onClick={create}>
          Add brand
        </Button>
      </div>
      <Card>
        <CardContent className='divide-border divide-y p-0'>
          {brands.length === 0 ? (
            <p className='text-muted-foreground p-4 text-sm'>No brands yet.</p>
          ) : (
            brands.map((b) => (
              <div key={b.id} className='flex items-center justify-between px-4 py-3'>
                <div>
                  <div className='font-medium'>{b.displayName}</div>
                  <div className='text-muted-foreground text-xs'>{b.slug}</div>
                </div>
                <ConfirmAction
                  trigger={deleteTrigger(b)}
                  title='Delete brand'
                  description={`Are you sure you want to delete "${b.displayName}"? This action is irreversible.`}
                  confirmLabel='Delete'
                  destructive
                  onConfirm={async () => remove(b)}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
