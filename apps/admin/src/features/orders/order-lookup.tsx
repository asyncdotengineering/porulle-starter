'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function OrderLookup() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/dashboard/orders?q=${encodeURIComponent(q.trim())}` : '/dashboard/orders');
  }

  return (
    <form onSubmit={submit} className='flex max-w-md gap-2'>
      <Input
        placeholder='Look up by email, name, or address…'
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Button type='submit' variant='outline'>
        Look up
      </Button>
      {params.get('q') ? (
        <Button type='button' variant='ghost' onClick={() => router.push('/dashboard/orders')}>
          Clear
        </Button>
      ) : null}
    </form>
  );
}
