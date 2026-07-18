'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { AdminInteraction } from '@/lib/porulle/customers';
import { addCustomerNoteAction } from './actions';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export function NotesPanel({
  customerId,
  interactions
}: {
  customerId: string;
  interactions: AdminInteraction[];
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      const result = await addCustomerNoteAction(customerId, note);
      if (result.error) toast.error(result.error);
      else {
        toast.success('Note added');
        setNote('');
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Notes</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Textarea
            placeholder='Add a note about this customer…'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <Button size='sm' disabled={pending || !note.trim()} onClick={add}>
            Add note
          </Button>
        </div>
        {interactions.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No notes yet.</p>
        ) : (
          <ul className='space-y-3'>
            {interactions.map((i) => (
              <li key={i.id} className='border-border border-l-2 pl-3'>
                <p className='text-sm'>{i.notes}</p>
                <p className='text-muted-foreground text-xs'>
                  {i.kind} · {formatDate(i.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
