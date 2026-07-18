'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmAction } from '@/components/confirm-action';
import { captureOrderAction, refundOrderAction } from './actions';

export function PaymentActions({
  id,
  status,
  amountCaptured
}: {
  id: string;
  status: string;
  amountCaptured: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const terminal = status === 'cancelled' || status === 'refunded';
  const canCapture = !terminal && amountCaptured <= 0;
  const canRefund = !terminal && (amountCaptured > 0 || status === 'fulfilled');

  if (!canCapture && !canRefund) return null;

  function run(fn: () => Promise<{ error?: string }>, ok: string) {
    startTransition(async () => {
      const result = await fn();
      if (result.error) toast.error(result.error);
      else {
        toast.success(ok);
        router.refresh();
      }
    });
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {canCapture ? (
        <Button size='sm' disabled={pending} onClick={() => run(() => captureOrderAction(id), 'Payment captured')}>
          Capture payment
        </Button>
      ) : null}
      {canRefund ? (
        <ConfirmAction
          trigger={
            <Button
              size='sm'
              variant='outline'
              className='text-destructive'
              disabled={pending}
            >
              Refund
            </Button>
          }
          title="Refund order"
          description="This will refund the captured payment. This action is irreversible."
          confirmLabel="Refund"
          destructive
          onConfirm={async () => {
            const result = await refundOrderAction(id, 'Refund initiated by operator');
            if (result.error) toast.error(result.error);
            else {
              toast.success('Order refunded');
              router.refresh();
            }
          }}
        />
      ) : null}
    </div>
  );
}
