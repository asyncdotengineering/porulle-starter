'use client';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Icons } from '@/components/icons';
import { Button } from './ui/button';
import { searchAction } from '@/features/search/actions';
import type { SearchHit } from '@/lib/porulle/search';

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => setHits(await searchAction(q)));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function routeFor(hit: SearchHit): string {
    switch (hit.type) {
      case 'product':
        return `/dashboard/products/${hit.id}`;
      case 'category':
        return `/dashboard/categories`;
      case 'brand':
        return `/dashboard/brands`;
      case 'order':
        return `/dashboard/orders/${hit.id}`;
      case 'customer':
        return `/dashboard/customers/${hit.id}`;
      case 'promotion':
        return `/dashboard/promotions`;
      case 'pricing_modifier':
        return `/dashboard/pricing-modifiers`;
      default:
        return `/dashboard/${hit.type.replace(/_/g, '-')}s`;
    }
  }

  function go(hit: SearchHit) {
    setOpen(false);
    setQ('');
    router.push(routeFor(hit));
  }

  return (
    <>
      <Button
        variant='outline'
        className='bg-background text-muted-foreground relative h-9 w-full justify-start rounded-[0.5rem] text-sm font-normal shadow-none sm:pr-12 md:w-40 lg:w-64'
        onClick={() => setOpen(true)}
      >
        <Icons.search className='mr-2 h-4 w-4' />
        Search...
        <kbd className='bg-muted pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-6 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium select-none sm:flex'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='overflow-hidden p-0'>
          <DialogHeader className='sr-only'>
            <DialogTitle>Search catalog</DialogTitle>
          </DialogHeader>
          <Command shouldFilter={false}>
            <CommandInput placeholder='Search products…' value={q} onValueChange={setQ} />
            <CommandList>
              <CommandEmpty>{pending ? 'Searching…' : q.trim() ? 'No results.' : 'Type to search.'}</CommandEmpty>
              {hits.length > 0 ? (
                <CommandGroup heading='Products'>
                  {hits.map((h) => (
                    <CommandItem key={h.id} value={h.id} onSelect={() => go(h)}>
                      <Icons.product className='mr-2 size-4' />
                      <span className='flex-1'>{h.title}</span>
                      <span className='text-muted-foreground text-xs capitalize'>{h.status}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
