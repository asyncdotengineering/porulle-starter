'use client';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setStockAction } from './actions';

export function StockPanel({
  entityId,
  onHand,
  reserved
}: {
  entityId: string;
  onHand: number;
  reserved: number;
}) {
  const [value, setValue] = useState(String(onHand));
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Stock</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex gap-6 text-sm'>
          <div>
            <div className='text-muted-foreground'>On hand</div>
            <div className='text-2xl font-semibold tabular-nums'>{onHand}</div>
          </div>
          <div>
            <div className='text-muted-foreground'>Reserved</div>
            <div className='text-2xl font-semibold tabular-nums'>{reserved}</div>
          </div>
        </div>
        <div className='flex items-end gap-2'>
          <div className='grid gap-1.5'>
            <Label htmlFor='stock'>Set on hand</Label>
            <Input
              id='stock'
              type='number'
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className='w-32'
            />
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await setStockAction(entityId, Number(value));
                if (result.error) toast.error(result.error);
                else toast.success('Stock updated');
              })
            }
          >
            Update stock
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
