'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompensationFailure, FailedJob } from '@/lib/porulle/ops';
import { resolveCompensationAction, retryJobAction } from './actions';

function ts(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export function OpsView({
  jobs,
  compensations
}: {
  jobs: FailedJob[];
  compensations: CompensationFailure[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Failed jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent className='divide-border divide-y p-0'>
          {jobs.length === 0 ? (
            <p className='text-muted-foreground p-4 text-sm'>No failed jobs. ✓</p>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className='flex items-start justify-between gap-3 px-4 py-3'>
                <div className='min-w-0'>
                  <div className='font-medium'>{j.name}</div>
                  <div className='text-muted-foreground truncate text-xs'>{j.error}</div>
                  <div className='text-muted-foreground text-xs'>
                    {j.attempts} attempts · {ts(j.createdAt)}
                  </div>
                </div>
                <Button size='sm' variant='outline' disabled={pending} onClick={() => run(() => retryJobAction(j.id), 'Job re-queued')}>
                  Retry
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Compensation failures ({compensations.length})</CardTitle>
        </CardHeader>
        <CardContent className='divide-border divide-y p-0'>
          {compensations.length === 0 ? (
            <p className='text-muted-foreground p-4 text-sm'>No stuck compensations. ✓</p>
          ) : (
            compensations.map((c) => (
              <div key={c.id} className='flex items-start justify-between gap-3 px-4 py-3'>
                <div className='min-w-0'>
                  <div className='font-medium'>{c.operation}</div>
                  <div className='text-muted-foreground truncate text-xs'>{c.error}</div>
                  <div className='text-muted-foreground text-xs'>{ts(c.createdAt)}</div>
                </div>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={pending}
                  onClick={() => run(() => resolveCompensationAction(c.id), 'Marked resolved')}
                >
                  Resolve
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
