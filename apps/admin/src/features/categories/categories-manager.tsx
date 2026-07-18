'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AdminCategory } from '@/lib/porulle/categories';
import { createCategoryAction, setCategoryArchivedAction } from './actions';

export function CategoriesManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pending, startTransition] = useTransition();

  function create() {
    startTransition(async () => {
      const result = await createCategoryAction(name);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Added ${name}`);
        setName('');
        router.refresh();
      }
    });
  }

  function toggle(c: AdminCategory) {
    const archived = c.status !== 'archived';
    startTransition(async () => {
      const result = await setCategoryArchivedAction(c.id, archived);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`${archived ? 'Archived' : 'Restored'} ${c.name}`);
        router.refresh();
      }
    });
  }

  return (
    <div className='flex max-w-2xl flex-col gap-4'>
      <div className='flex gap-2'>
        <Input
          placeholder='New category name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && create()}
        />
        <Button disabled={pending || !name.trim()} onClick={create}>
          Add category
        </Button>
      </div>
      <Card>
        <CardContent className='divide-border divide-y p-0'>
          {categories.length === 0 ? (
            <p className='text-muted-foreground p-4 text-sm'>No categories yet.</p>
          ) : (
            categories.map((c) => (
              <div key={c.id} className='flex items-center justify-between px-4 py-3'>
                <div className='flex items-center gap-3'>
                  <span className='font-medium'>{c.name}</span>
                  {c.status === 'archived' ? (
                    <Badge
                      variant='outline'
                      className={cn('border-transparent bg-muted text-muted-foreground')}
                    >
                      Archived
                    </Badge>
                  ) : null}
                  <span className='text-muted-foreground text-xs'>{c.slug}</span>
                </div>
                <Button variant='ghost' size='sm' disabled={pending} onClick={() => toggle(c)}>
                  {c.status === 'archived' ? 'Restore' : 'Archive'}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
