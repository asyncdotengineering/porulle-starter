'use client';
import { useState, useActionState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmAction } from '@/components/confirm-action';
import type { ShippingZone, ShippingRate } from '@/lib/porulle/shipping';
import { saveShippingZoneAction, removeShippingZoneAction, saveShippingRateAction, removeShippingRateAction, type ShippingFormState } from './actions';

function useFormDone(state: ShippingFormState, onDone: () => void) {
  const submitted = useRef(false);
  useEffect(() => {
    if (submitted.current && !state.error) onDone();
    submitted.current = true;
  }, [state]);
}

function CreateZoneForm({ onDone }: { onDone: () => void }) {
  const [state, formAction] = useActionState<ShippingFormState, FormData>(saveShippingZoneAction, {});
  useFormDone(state, onDone);
  return (
    <form action={formAction} className='flex flex-col gap-2'>
      <div className='grid grid-cols-2 gap-2'>
        <div className='grid gap-1'><Label htmlFor='nz-name' className='text-xs'>Name</Label><Input id='nz-name' name='name' required className='h-8 text-xs' /></div>
        <div className='grid gap-1'><Label htmlFor='nz-countries' className='text-xs'>Countries (comma-separated)</Label><Input id='nz-countries' name='countries' required placeholder='US, CA, MX' className='h-8 text-xs' /></div>
      </div>
      {state.error ? <p className='text-destructive text-xs'>{state.error}</p> : null}
      <div className='flex items-center gap-2'>
        <Button type='submit' size='sm' className='h-7 text-xs'>Save</Button>
        <Button type='button' variant='outline' size='sm' className='h-7 text-xs' onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

function EditZoneForm({ zone, onDone }: { zone: ShippingZone; onDone: () => void }) {
  const [state, formAction] = useActionState<ShippingFormState, FormData>(saveShippingZoneAction, {});
  useFormDone(state, onDone);
  return (
    <form action={formAction} className='flex flex-col gap-2'>
      <input type='hidden' name='id' value={zone.id} />
      <div className='grid grid-cols-2 gap-2'>
        <div className='grid gap-1'><Label htmlFor='ez-name' className='text-xs'>Name</Label><Input id='ez-name' name='name' defaultValue={zone.name} required className='h-8 text-xs' /></div>
        <div className='grid gap-1'><Label htmlFor='ez-countries' className='text-xs'>Countries</Label><Input id='ez-countries' name='countries' defaultValue={zone.countries.join(', ')} required className='h-8 text-xs' /></div>
      </div>
      {state.error ? <p className='text-destructive text-xs'>{state.error}</p> : null}
      <div className='flex items-center gap-2'>
        <Button type='submit' size='sm' className='h-7 text-xs'>Save</Button>
        <Button type='button' variant='outline' size='sm' className='h-7 text-xs' onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

function CreateRateForm({ zoneId, onDone }: { zoneId: string; onDone: () => void }) {
  const [state, formAction] = useActionState<ShippingFormState, FormData>(saveShippingRateAction, {});
  useFormDone(state, onDone);
  return (
    <form action={formAction} className='flex flex-col gap-2'>
      <input type='hidden' name='zoneId' value={zoneId} />
      <div className='grid grid-cols-2 gap-2'>
        <div className='grid gap-1'><Label htmlFor='nr-name' className='text-xs'>Name</Label><Input id='nr-name' name='name' required className='h-8 text-xs' /></div>
        <div className='grid gap-1'><Label htmlFor='nr-amount' className='text-xs'>Cost (cents)</Label><Input id='nr-amount' name='amount' type='number' min={0} defaultValue={0} required className='h-8 text-xs' /></div>
      </div>
      {state.error ? <p className='text-destructive text-xs'>{state.error}</p> : null}
      <div className='flex items-center gap-2'>
        <Button type='submit' size='sm' className='h-7 text-xs'>Save</Button>
        <Button type='button' variant='outline' size='sm' className='h-7 text-xs' onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

function EditRateForm({ rate, onDone }: { rate: ShippingRate; onDone: () => void }) {
  const [state, formAction] = useActionState<ShippingFormState, FormData>(saveShippingRateAction, {});
  useFormDone(state, onDone);
  return (
    <form action={formAction} className='flex flex-col gap-2'>
      <input type='hidden' name='id' value={rate.id} />
      <div className='grid grid-cols-2 gap-2'>
        <div className='grid gap-1'><Label htmlFor='er-name' className='text-xs'>Name</Label><Input id='er-name' name='name' defaultValue={rate.name} required className='h-8 text-xs' /></div>
        <div className='grid gap-1'><Label htmlFor='er-amount' className='text-xs'>Cost (cents)</Label><Input id='er-amount' name='amount' type='number' min={0} defaultValue={rate.amount} required className='h-8 text-xs' /></div>
      </div>
      {state.error ? <p className='text-destructive text-xs'>{state.error}</p> : null}
      <div className='flex items-center gap-2'>
        <Button type='submit' size='sm' className='h-7 text-xs'>Save</Button>
        <Button type='button' variant='outline' size='sm' className='h-7 text-xs' onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

export function ShippingManager({ zones, rates }: { zones: ShippingZone[]; rates: ShippingRate[] }) {
  const [addingZone, setAddingZone] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [addingRateFor, setAddingRateFor] = useState<string | null>(null);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);

  const ratesByZone = new Map<string, ShippingRate[]>();
  for (const r of rates) { const arr = ratesByZone.get(r.zoneId) ?? []; arr.push(r); ratesByZone.set(r.zoneId, arr); }

  return (
    <div className='flex max-w-3xl flex-col gap-6'>
      <div>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='text-sm font-semibold'>Shipping zones</h3>
          {!addingZone ? <Button size='sm' variant='outline' className='h-7 text-xs' onClick={() => setAddingZone(true)}>Add zone</Button> : null}
        </div>
        {addingZone ? <Card className='mb-2'><CardContent className='p-3'><CreateZoneForm onDone={() => setAddingZone(false)} /></CardContent></Card> : null}
        <Card>
          <CardContent className='divide-border divide-y p-0'>
            {zones.length === 0 && !addingZone ? <p className='text-muted-foreground p-4 text-sm'>No shipping zones configured.</p> : zones.map((z) => (
              <div key={z.id} className='px-4 py-3'>
                {editingZoneId === z.id ? <EditZoneForm zone={z} onDone={() => setEditingZoneId(null)} /> : (
                  <>
                    <div className='flex items-start justify-between'>
                      <div>
                        <div className='font-medium'>{z.name}</div>
                        <div className='text-muted-foreground text-xs'>{z.countries.join(', ')}</div>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Button size='sm' variant='ghost' className='h-7 text-xs' onClick={() => setEditingZoneId(z.id)}>Edit</Button>
                        <ConfirmAction trigger={<Button size='sm' variant='ghost' className='h-7 text-xs text-destructive'>Delete</Button>} title='Delete shipping zone' description={`Delete "${z.name}" and all its rates?`} destructive onConfirm={async () => { await removeShippingZoneAction(z.id); }} />
                      </div>
                    </div>
                    <div className='mt-1 space-y-1'>
                      {(ratesByZone.get(z.id) ?? []).map((r) => (
                        <div key={r.id}>
                          {editingRateId === r.id ? <EditRateForm rate={r} onDone={() => setEditingRateId(null)} /> : (
                            <div className='flex items-center justify-between text-xs py-0.5'>
                              <span className='text-muted-foreground'>{r.name}{r.isActive ? '' : ' · inactive'}</span>
                              <div className='flex items-center gap-0.5'>
                                <span className='font-medium'>${(r.amount / 100).toFixed(2)}</span>
                                <Button size='sm' variant='ghost' className='h-5 text-xs px-1' onClick={() => setEditingRateId(r.id)}>Edit</Button>
                                <ConfirmAction trigger={<Button size='sm' variant='ghost' className='h-5 text-xs px-1 text-destructive'>×</Button>} title='Delete shipping rate' description={`Delete "${r.name}"?`} destructive confirmLabel='Delete' onConfirm={async () => { await removeShippingRateAction(r.id); }} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {addingRateFor === z.id ? <div className='pt-1 pb-1'><CreateRateForm zoneId={z.id} onDone={() => setAddingRateFor(null)} /></div> : <Button size='sm' variant='ghost' className='h-5 text-xs text-muted-foreground' onClick={() => setAddingRateFor(z.id)}>+ Add rate</Button>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
