'use client';
/* eslint-disable @next/next/no-img-element */
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { uploadProductImageAction } from './actions';

export function ImagePanel({ entityId, image }: { entityId: string; image: string | null }) {
  const [current, setCurrent] = useState(image);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function onFile(file: File | undefined) {
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    startTransition(async () => {
      const result = await uploadProductImageAction(entityId, form);
      if (result.error) toast.error(result.error);
      else {
        toast.success('Image updated');
        setCurrent(result.url ?? null);
      }
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Image</CardTitle>
      </CardHeader>
      <CardContent className='flex items-center gap-4'>
        <div className='bg-muted size-20 overflow-hidden rounded-md'>
          {current ? (
            <img src={current} alt='Product' className='size-full object-cover' />
          ) : null}
        </div>
        <div className='grid gap-1.5'>
          <Input
            ref={inputRef}
            type='file'
            accept='image/*'
            disabled={pending}
            onChange={(e) => onFile(e.target.files?.[0])}
            className='w-72'
          />
          <p className='text-muted-foreground text-xs'>
            {pending ? 'Uploading…' : 'Upload sets the featured image.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
