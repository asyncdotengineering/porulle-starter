'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { AdminProduct } from '@/lib/porulle/products';
import { saveProductAction, type ProductFormState } from './actions';

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type='submit' disabled={pending}>
      {pending ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
    </Button>
  );
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const [state, formAction] = useActionState<ProductFormState, FormData>(saveProductAction, {});
  const editing = Boolean(product);

  return (
    <form action={formAction} className='max-w-2xl space-y-6'>
      {product ? <input type='hidden' name='id' value={product.id} /> : null}

      <div className='grid gap-2'>
        <Label htmlFor='title'>Title</Label>
        <Input id='title' name='title' defaultValue={product?.title} required />
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='slug'>Slug</Label>
        <Input
          id='slug'
          name='slug'
          defaultValue={product?.slug}
          placeholder='classic-logo-tee'
          required
          readOnly={editing}
        />
        {editing ? (
          <p className='text-muted-foreground text-xs'>The slug can&apos;t be changed after creation.</p>
        ) : null}
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='description'>Description</Label>
        <Textarea id='description' name='description' defaultValue={product?.description} rows={4} />
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='price'>Price (USD)</Label>
        <Input
          id='price'
          name='price'
          type='number'
          step='0.01'
          min='0'
          defaultValue={product ? (product.priceAmount / 100).toFixed(2) : ''}
          required
        />
      </div>

      <div className='flex items-center justify-between rounded-lg border p-4'>
        <div>
          <Label htmlFor='publish'>Published</Label>
          <p className='text-muted-foreground text-sm'>Visible in the storefront when on.</p>
        </div>
        <Switch id='publish' name='publish' defaultChecked={product ? product.status === 'active' : true} />
      </div>

      {state.error ? <p className='text-destructive text-sm'>{state.error}</p> : null}

      <div className='flex items-center gap-3'>
        <SubmitButton editing={editing} />
        <Button asChild variant='outline'>
          <Link href='/dashboard/products'>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
