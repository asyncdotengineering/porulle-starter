'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProductVariants } from '@/lib/porulle/variants';
import { addOptionTypeAction, generateVariantsAction } from './actions';

export function VariantsPanel({ entityId, data }: { entityId: string; data: ProductVariants }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [values, setValues] = useState('');
  const [pending, startTransition] = useTransition();

  function addOption() {
    startTransition(async () => {
      const result = await addOptionTypeAction(entityId, name, values.split(','));
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Added ${name}`);
        setName('');
        setValues('');
        router.refresh();
      }
    });
  }

  function generate() {
    startTransition(async () => {
      const result = await generateVariantsAction(entityId);
      if (result.error) toast.error(result.error);
      else {
        toast.success('Variants generated');
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Variants</CardTitle>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='space-y-2'>
          {data.optionTypes.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No options yet. Add one, then generate variants.</p>
          ) : (
            data.optionTypes.map((ot) => (
              <div key={ot.id} className='flex items-center gap-2 text-sm'>
                <span className='font-medium'>{ot.name}:</span>
                <span className='text-muted-foreground'>{ot.values.join(', ')}</span>
              </div>
            ))
          )}
        </div>

        <div className='flex flex-wrap items-end gap-2'>
          <div className='grid gap-1.5'>
            <Label htmlFor='opt-name'>Option</Label>
            <Input
              id='opt-name'
              placeholder='Color'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='w-32'
            />
          </div>
          <div className='grid gap-1.5'>
            <Label htmlFor='opt-values'>Values (comma-separated)</Label>
            <Input
              id='opt-values'
              placeholder='Red, Blue, Green'
              value={values}
              onChange={(e) => setValues(e.target.value)}
              className='w-56'
            />
          </div>
          <Button variant='outline' disabled={pending || !name.trim() || !values.trim()} onClick={addOption}>
            Add option
          </Button>
          <Button disabled={pending || data.optionTypes.length === 0} onClick={generate}>
            Generate variants
          </Button>
        </div>

        {data.variants.length > 0 ? (
          <div className='space-y-1'>
            <Label>{data.variants.length} variants</Label>
            <div className='flex flex-wrap gap-2'>
              {data.variants.map((v) => (
                <Badge key={v.id} variant='outline'>
                  {v.label}
                  {v.sku ? <span className='text-muted-foreground ml-1'>· {v.sku}</span> : null}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
