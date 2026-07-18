'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import type { AdminOrderLine, AdminFulfillment } from '@/lib/porulle/orders';
import { createFulfillmentAction } from './actions';

function remainingQty(lineItem: AdminOrderLine, fulfillments: AdminFulfillment[]): number {
  const fulfilled = fulfillments.reduce((n, f) => {
    const match = f.lineItems.find((li) => li.id === lineItem.id);
    return n + (match?.quantity ?? 0);
  }, 0);
  return Math.max(0, lineItem.quantity - fulfilled);
}

interface Props {
  orderId: string;
  lineItems: AdminOrderLine[];
  fulfillments: AdminFulfillment[];
}

export function FulfillmentCreate({ orderId, lineItems, fulfillments }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});

  const unfulfilled = lineItems.filter((li) => remainingQty(li, fulfillments) > 0);
  const hasSelection = Object.values(selected).some((q) => q > 0);

  function handleSubmit() {
    const selLines = Object.entries(selected)
      .filter(([, qty]) => qty > 0)
      .map(([orderLineItemId, quantity]) => ({ orderLineItemId, quantity }));
    if (selLines.length === 0) return;

    const input: Parameters<typeof createFulfillmentAction>[1] = { lineItems: selLines };
    if (carrier.trim()) input.carrier = carrier.trim();
    if (trackingNumber.trim()) input.trackingNumber = trackingNumber.trim();
    if (trackingUrl.trim()) input.trackingUrl = trackingUrl.trim();

    startTransition(async () => {
      const result = await createFulfillmentAction(orderId, input);
      if (result.error) toast.error(result.error);
      else {
        toast.success('Fulfillment recorded');
        setOpen(false);
        setSelected({});
        setCarrier('');
        setTrackingNumber('');
        setTrackingUrl('');
        router.refresh();
      }
    });
  }

  if (unfulfilled.length === 0) {
    return <p className='text-muted-foreground text-xs'>All line items are fulfilled.</p>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline' className='w-full'>
          Record fulfillment
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Record fulfillment</DialogTitle>
          <DialogDescription>
            Ship a subset of line items — each with a quantity up to the remaining unfulfilled amount.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          {unfulfilled.map((li) => {
            const rem = remainingQty(li, fulfillments);
            const cur = selected[li.id] ?? 0;
            return (
              <div key={li.id} className='flex items-center gap-3'>
                <Checkbox
                  id={`line-${li.id}`}
                  checked={cur > 0}
                  onCheckedChange={(v) => {
                    setSelected((prev) => ({
                      ...prev,
                      [li.id]: v ? (prev[li.id] || rem) : 0
                    }));
                  }}
                />
                <Label htmlFor={`line-${li.id}`} className='flex-1 text-sm'>
                  {li.title}
                  {li.sku ? <span className='text-muted-foreground ml-1 text-xs'>{li.sku}</span> : null}
                </Label>
                <Input
                  type='number'
                  min={1}
                  max={rem}
                  value={cur || ''}
                  onChange={(e) => {
                    const v = Math.min(rem, Math.max(0, parseInt(e.target.value, 10) || 0));
                    setSelected((prev) => ({ ...prev, [li.id]: v }));
                  }}
                  disabled={cur === 0}
                  className='w-16 text-right'
                />
                <span className='text-muted-foreground w-8 text-xs'>/ {rem}</span>
              </div>
            );
          })}

          <div className='border-t pt-4 space-y-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='carrier' className='text-xs'>
                Carrier (optional)
              </Label>
              <Input
                id='carrier'
                placeholder='DHL, UPS, FedEx…'
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='tracking' className='text-xs'>
                Tracking number (optional)
              </Label>
              <Input
                id='tracking'
                placeholder='1Z999AA10123456784'
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='trackingUrl' className='text-xs'>
                Tracking URL (optional)
              </Label>
              <Input
                id='trackingUrl'
                placeholder='https://track.dhl.com/…'
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending || !hasSelection}>
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
