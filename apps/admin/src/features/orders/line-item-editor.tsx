'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmAction } from '@/components/confirm-action';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AdminOrderLine } from '@/lib/porulle/orders';
import {
  addOrderLineItemAction,
  removeOrderLineItemAction,
  searchOrderableAction,
  updateOrderLineItemAction,
  type OrderableProduct
} from './actions';

interface Props {
  orderId: string;
  lineItems: AdminOrderLine[];
}

export function LineItemEditor({ orderId, lineItems: initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<OrderableProduct[]>([]);
  const [editing, setEditing] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => setResults(await searchOrderableAction(q)));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function handleAdd(p: OrderableProduct) {
    setQ('');
    setResults([]);
    startTransition(async () => {
      const result = await addOrderLineItemAction(orderId, {
        entityId: p.entityId,
        title: p.title,
        quantity: 1,
        unitPrice: p.unitPrice
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success('Line item added');
        router.refresh();
      }
    });
  }

  function handleUpdateQty(lineItemId: string) {
    const qty = editing[lineItemId];
    if (qty === undefined || qty < 1) return;
    startTransition(async () => {
      const result = await updateOrderLineItemAction(orderId, lineItemId, qty);
      if (result.error) toast.error(result.error);
      else {
        toast.success('Quantity updated');
        setEditing((prev) => {
          const next = { ...prev };
          delete next[lineItemId];
          return next;
        });
        router.refresh();
      }
    });
  }

  function handleRemove(lineItemId: string, title: string) {
    startTransition(async () => {
      const result = await removeOrderLineItemAction(orderId, lineItemId);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Removed ${title}`);
        router.refresh();
      }
    });
  }

  return (
    <div className='space-y-4'>
      <div className='relative'>
        <Input
          placeholder='Search products to add…'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {results.length > 0 ? (
          <div className='bg-popover absolute z-10 mt-1 w-full rounded-md border shadow-md'>
            {results.map((p) => (
              <button
                key={p.entityId}
                type='button'
                className='hover:bg-accent flex w-full items-center justify-between px-3 py-2 text-left text-sm'
                onClick={() => handleAdd(p)}
              >
                <span>{p.title}</span>
                <span className='text-muted-foreground'>{p.priceLabel}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className='w-24 text-right'>Qty</TableHead>
            <TableHead className='w-24 text-right'>Unit</TableHead>
            <TableHead className='w-24 text-right'>Total</TableHead>
            <TableHead>Fulfillment</TableHead>
            <TableHead className='w-10' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {initial.map((li) => {
            const curQty = editing[li.id] ?? li.quantity;
            const changed = editing[li.id] !== undefined;
            return (
              <TableRow key={li.id}>
                <TableCell className='font-medium'>
                  {li.title}
                  {li.sku ? <span className='text-muted-foreground ml-2 text-xs'>{li.sku}</span> : null}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex items-center gap-1 justify-end'>
                    <Input
                      type='number'
                      min={1}
                      value={curQty}
                      onChange={(e) => {
                        const v = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setEditing((prev) => ({ ...prev, [li.id]: v }));
                      }}
                      className='w-16 text-right'
                    />
                    {changed ? (
                      <Button
                        size='icon'
                        variant='ghost'
                        className='size-7'
                        disabled={pending}
                        onClick={() => handleUpdateQty(li.id)}
                      >
                        <Icons.check className='size-3' />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className='text-right tabular-nums'>{li.unitPriceLabel}</TableCell>
                <TableCell className='text-right tabular-nums'>
                  {changed ? '—' : li.totalLabel}
                </TableCell>
                <TableCell>
                  <Badge variant='outline' className='capitalize'>
                    {li.fulfillmentStatus.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ConfirmAction
                    trigger={
                      <Button size='icon' variant='ghost' className='size-8' disabled={pending}>
                        <Icons.trash className='size-4 text-destructive' />
                      </Button>
                    }
                    title='Remove line item'
                    description={`Remove "${li.title}" from this order? This action is irreversible.`}
                    confirmLabel='Remove'
                    destructive
                    onConfirm={async () => handleRemove(li.id, li.title)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
