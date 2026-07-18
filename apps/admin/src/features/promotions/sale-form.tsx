'use client';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { SALE_TYPES } from '@/lib/porulle/promotion-types';
import { createSaleAction } from './actions';

const selectClass =
  'border-input bg-background h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

export function SaleForm() {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(SALE_TYPES[0].value);
  const [value, setValue] = useState('20');
  const [validUntil, setValidUntil] = useState('');
  const [pending, startTransition] = useTransition();

  function create() {
    startTransition(async () => {
      const result = await createSaleAction({
        name,
        type,
        value: Number(value),
        validUntil: validUntil ? new Date(validUntil).toISOString() : '',
        entityId: ''
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Sale “${name}” scheduled`);
        setName('');
        setValidUntil('');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Scheduled sale (store-wide)</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-wrap items-end gap-3'>
        <div className='grid gap-1.5'>
          <Label htmlFor='sale-name'>Name</Label>
          <Input id='sale-name' value={name} onChange={(e) => setName(e.target.value)} className='w-44' />
        </div>
        <div className='grid gap-1.5'>
          <Label htmlFor='sale-type'>Type</Label>
          <select id='sale-type' value={type} onChange={(e) => setType(e.target.value)} className={cn(selectClass, 'w-32')}>
            {SALE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className='grid gap-1.5'>
          <Label htmlFor='sale-value'>Value</Label>
          <Input id='sale-value' type='number' min={0} value={value} onChange={(e) => setValue(e.target.value)} className='w-24' />
        </div>
        <div className='grid gap-1.5'>
          <Label htmlFor='sale-until'>Ends</Label>
          <Input id='sale-until' type='date' value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className='w-40' />
        </div>
        <Button disabled={pending || !name.trim() || !validUntil} onClick={create}>
          Schedule sale
        </Button>
      </CardContent>
    </Card>
  );
}
