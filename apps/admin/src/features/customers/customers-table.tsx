'use client';
import { DataTable } from '@/components/data-table/data-table';
import type { AdminCustomer } from '@/lib/porulle/customers';
import { customersColumns } from './customers-columns';

export function CustomersTable({ data }: { data: AdminCustomer[] }) {
  return (
    <DataTable
      columns={customersColumns}
      data={data}
      searchKey='name'
      searchPlaceholder='Filter customers...'
    />
  );
}
