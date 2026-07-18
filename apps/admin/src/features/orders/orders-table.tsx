'use client';
import { DataTable } from '@/components/data-table/data-table';
import type { AdminOrder } from '@/lib/porulle/orders';
import { ordersColumns } from './orders-columns';

const STATUS_FILTER = [
  {
    columnId: 'status',
    title: 'Status',
    options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Processing', value: 'processing' },
      { label: 'Fulfilled', value: 'fulfilled' },
      { label: 'Cancelled', value: 'cancelled' },
      { label: 'Refunded', value: 'refunded' }
    ]
  }
];

export function OrdersTable({ data }: { data: AdminOrder[] }) {
  return (
    <DataTable
      columns={ordersColumns}
      data={data}
      searchKey='orderNumber'
      searchPlaceholder='Filter orders...'
      filters={STATUS_FILTER}
    />
  );
}
