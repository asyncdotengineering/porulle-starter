'use client';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/data-table';
import type { AdminCustomer } from '@/lib/porulle/customers';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { dateStyle: 'medium' });
}

export const customersColumns: ColumnDef<AdminCustomer>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Customer' />,
    cell: ({ row }) => (
      <Link
        href={`/dashboard/customers/${row.original.id}`}
        className='font-medium underline-offset-4 hover:underline'
      >
        {row.getValue('name')}
      </Link>
    ),
    enableHiding: false
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Email' />,
    cell: ({ row }) => <span className='text-muted-foreground'>{row.getValue('email')}</span>
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Phone' />,
    cell: ({ row }) => <span className='text-muted-foreground'>{row.getValue('phone')}</span>
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Joined' />,
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{formatDate(row.getValue('createdAt'))}</span>
    )
  }
];
