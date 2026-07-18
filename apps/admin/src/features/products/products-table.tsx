'use client';
import { DataTable } from '@/components/data-table/data-table';
import type { AdminProduct } from '@/lib/porulle/products';
import { productsColumns } from './products-columns';

const STATUS_FILTER = [
  {
    columnId: 'status',
    title: 'Status',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Draft', value: 'draft' },
      { label: 'Archived', value: 'archived' },
      { label: 'Discontinued', value: 'discontinued' }
    ]
  }
];

export function ProductsTable({ data }: { data: AdminProduct[] }) {
  return (
    <DataTable
      columns={productsColumns}
      data={data}
      searchKey='title'
      searchPlaceholder='Filter products...'
      filters={STATUS_FILTER}
    />
  );
}
