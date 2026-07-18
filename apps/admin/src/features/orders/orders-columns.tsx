'use client';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AdminOrder } from '@/lib/porulle/orders';

const GREEN = 'border-transparent bg-green-500/15 text-green-700 dark:text-green-400';
const AMBER = 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400';
const BLUE = 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400';

export const ORDER_STATUS_STYLE: Record<string, string> = {
  pending: AMBER,
  confirmed: BLUE,
  processing: BLUE,
  partially_fulfilled: BLUE,
  fulfilled: GREEN,
  cancelled: 'border-transparent bg-destructive/15 text-destructive',
  refunded: 'border-transparent bg-muted text-muted-foreground'
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { dateStyle: 'medium' });
}

export const ordersColumns: ColumnDef<AdminOrder>[] = [
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Order' />,
    cell: ({ row }) => (
      <Link
        href={`/dashboard/orders/${row.original.id}`}
        className='font-medium underline-offset-4 hover:underline'
      >
        {row.getValue('orderNumber')}
      </Link>
    ),
    enableHiding: false
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    cell: ({ row }) => (
      <Badge
        variant='outline'
        className={cn('capitalize', ORDER_STATUS_STYLE[row.getValue('status') as string])}
      >
        {(row.getValue('status') as string).replace(/_/g, ' ')}
      </Badge>
    ),
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
    enableSorting: false
  },
  {
    accessorKey: 'total',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Total' />,
    cell: ({ row }) => <span className='tabular-nums'>{row.original.totalLabel}</span>
  },
  {
    accessorKey: 'placedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Placed' />,
    cell: ({ row }) => <span className='text-muted-foreground'>{formatDate(row.getValue('placedAt'))}</span>
  }
];
