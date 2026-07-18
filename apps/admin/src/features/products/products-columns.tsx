'use client';
import type { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { DataTableColumnHeader } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AdminProduct } from '@/lib/porulle/products';
import { ProductRowActions } from './product-row-actions';

const STATUS_STYLE: Record<string, string> = {
  active: 'border-transparent bg-green-500/15 text-green-700 dark:text-green-400',
  draft: 'border-transparent bg-muted text-muted-foreground',
  archived: 'border-transparent bg-destructive/15 text-destructive',
  discontinued: 'border-transparent bg-destructive/15 text-destructive'
};

export const productsColumns: ColumnDef<AdminProduct>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div className='flex items-center gap-3'>
          <div className='bg-muted relative size-9 shrink-0 overflow-hidden rounded-md'>
            {p.image ? (
              <Image
                src={p.image}
                alt={p.title}
                fill
                sizes='36px'
                className='object-cover'
                // Next's optimizer refuses loopback hosts (SSRF guard); serve
                // dev backend assets directly. Prod assets on a real domain still optimize.
                unoptimized={/^https?:\/\/(localhost|127\.0\.0\.1)/.test(p.image)}
              />
            ) : null}
          </div>
          <div className='min-w-0'>
            <div className='truncate font-medium'>{p.title}</div>
            <div className='text-muted-foreground truncate text-xs'>{p.slug}</div>
          </div>
        </div>
      );
    },
    enableHiding: false
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    cell: ({ row }) => (
      <Badge
        variant='outline'
        className={cn('capitalize', STATUS_STYLE[row.getValue('status') as string])}
      >
        {row.getValue('status')}
      </Badge>
    ),
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
    enableSorting: false
  },
  {
    accessorKey: 'variantCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Variants' />,
    cell: ({ row }) => <span className='tabular-nums'>{row.getValue('variantCount')}</span>
  },
  {
    accessorKey: 'priceAmount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Price' />,
    cell: ({ row }) => <span className='tabular-nums'>{row.original.priceLabel}</span>
  },
  {
    id: 'actions',
    cell: ({ row }) => <ProductRowActions product={row.original} />,
    enableHiding: false,
    enableSorting: false,
    meta: { className: 'w-12' }
  }
];
