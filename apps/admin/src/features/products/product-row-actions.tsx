'use client';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import type { AdminProduct } from '@/lib/porulle/products';
import { ConfirmAction } from '@/components/confirm-action';
import { archiveProductAction } from './actions';

export function ProductRowActions({ product }: { product: AdminProduct }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='size-8' disabled={pending}>
          <Icons.ellipsis className='size-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/products/${product.id}`}>
            <Icons.edit className='mr-2 size-4' />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={product.status === 'archived' || pending}
          onSelect={(e) => e.preventDefault()}
          asChild
        >
          <ConfirmAction
            trigger={
              <button className='relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left'>
                <Icons.trash className='mr-2 size-4' />
                Archive
              </button>
            }
            title="Archive product"
            description={`Are you sure you want to archive "${product.title}"? It will be hidden from the storefront.`}
            confirmLabel="Archive"
            destructive
            onConfirm={async () => {
              const result = await archiveProductAction(product.id);
              if (result.error) toast.error(result.error);
              else toast.success(`Archived ${product.title}`);
            }}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
