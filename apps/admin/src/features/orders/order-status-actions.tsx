'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmAction } from '@/components/confirm-action';
import { changeOrderStatusAction } from './actions';

const DESTRUCTIVE = new Set(['cancelled', 'refunded']);

function label(status: string): string {
  return status.replace(/_/g, ' ');
}

export function OrderStatusActions({ id, allowed }: { id: string; allowed: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (allowed.length === 0) {
    return <p className='text-muted-foreground text-sm'>No further status changes are possible.</p>;
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {allowed.map((status) => {
        const isDestructive = DESTRUCTIVE.has(status);
        const button = (
          <Button
            key={status}
            size='sm'
            variant={isDestructive ? 'outline' : 'default'}
            disabled={pending}
            className={isDestructive ? 'text-destructive' : undefined}
          >
            <span className='capitalize'>{label(status)}</span>
          </Button>
        );

        if (!isDestructive) {
          return (
            <Button
              key={status}
              size='sm'
              variant='default'
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await changeOrderStatusAction(id, status);
                  if (result.error) toast.error(result.error);
                  else {
                    toast.success(`Order marked ${label(status)}`);
                    router.refresh();
                  }
                })
              }
            >
              <span className='capitalize'>{label(status)}</span>
            </Button>
          );
        }

        return (
          <ConfirmAction
            key={status}
            trigger={button}
            title={`Mark order ${label(status)}`}
            description={`This will ${label(status)} the order. This action is irreversible.`}
            confirmLabel={`${label(status)} order`}
            destructive
            onConfirm={async () => {
              const result = await changeOrderStatusAction(id, status);
              if (result.error) toast.error(result.error);
              else {
                toast.success(`Order marked ${label(status)}`);
                router.refresh();
              }
            }}
          />
        );
      })}
    </div>
  );
}
