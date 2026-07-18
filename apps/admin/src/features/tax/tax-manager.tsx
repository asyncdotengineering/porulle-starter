'use client';
import { useState, useActionState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmAction } from '@/components/confirm-action';
import type { TaxClass, TaxRate } from '@/lib/porulle/tax';
import { saveTaxClassAction, removeTaxClassAction, saveTaxRateAction, removeTaxRateAction, type TaxFormState } from './actions';

function useFormDone(state: TaxFormState, onDone: () => void) {
  const submitted = useRef(false);
  useEffect(() => {
    if (submitted.current && !state.error) onDone();
    submitted.current = true;
  }, [state]);
}

function CreateClassForm({ onDone }: { onDone: () => void }) {
  const [state, formAction] = useActionState<TaxFormState, FormData>(saveTaxClassAction, {});
  useFormDone(state, onDone);
  return (
    <form action={formAction} className='flex flex-col gap-2'>
      <div className='grid grid-cols-2 gap-2'>
        <div className='grid gap-1'><Label htmlFor='nc-name' className='text-xs'>Name (lowercase slug)</Label><Input id='nc-name' name='name' required pattern='[a-z][a-z0-9_-]*' placeholder='standard' className='h-8 text-xs' /></div>
        <div className='grid gap-1'><Label htmlFor='nc-rateBps' className='text-xs'>Rate (bps)</Label><Input id='nc-rateBps' name='rateBps' type='number' min={0} defaultValue={0} required className='h-8 text-xs' /></div>
      </div>
      <label className='flex items-center gap-1 text-xs'><input type='checkbox' name='isDefault' /> Default</label>
      {state.error ? <p className='text-destructive text-xs'>{state.error}</p> : null}
      <div className='flex items-center gap-2'>
        <Button type='submit' size='sm' className='h-7 text-xs'>Save</Button>
        <Button type='button' variant='outline' size='sm' className='h-7 text-xs' onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

function EditClassForm({ cls, onDone }: { cls: TaxClass; onDone: () => void }) {
  const [state, formAction] = useActionState<TaxFormState, FormData>(saveTaxClassAction, {});
  useFormDone(state, onDone);
  return (
    <form action={formAction} className='flex flex-col gap-2'>
      <input type='hidden' name='id' value={cls.id} />
      <div className='grid grid-cols-2 gap-2'>
        <div className='grid gap-1'><Label htmlFor='ec-name' className='text-xs'>Name</Label><Input id='ec-name' name='name' defaultValue={cls.name} required className='h-8 text-xs' /></div>
        <div className='grid gap-1'><Label htmlFor='ec-rateBps' className='text-xs'>Rate (bps)</Label><Input id='ec-rateBps' name='rateBps' type='number' min={0} defaultValue={cls.rateBps} required className='h-8 text-xs' /></div>
      </div>
      {state.error ? <p className='text-destructive text-xs'>{state.error}</p> : null}
      <div className='flex items-center gap-2'>
        <Button type='submit' size='sm' className='h-7 text-xs'>Save</Button>
        <Button type='button' variant='outline' size='sm' className='h-7 text-xs' onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

function CreateRateForm({ onDone }: { onDone: () => void }) {
  const [state, formAction] = useActionState<TaxFormState, FormData>(saveTaxRateAction, {});
  useFormDone(state, onDone);
  return (
    <form action={formAction} className='flex flex-col gap-2'>
      <div className='grid grid-cols-3 gap-2'>
        <div className='grid gap-1'><Label htmlFor='nr-name' className='text-xs'>Name</Label><Input id='nr-name' name='name' required className='h-8 text-xs' /></div>
        <div className='grid gap-1'><Label htmlFor='nr-country' className='text-xs'>Country</Label><Input id='nr-country' name='country' required placeholder='US' className='h-8 text-xs' /></div>
        <div className='grid gap-1'><Label htmlFor='nr-rateBps' className='text-xs'>Rate (bps)</Label><Input id='nr-rateBps' name='rateBps' type='number' min={0} defaultValue={0} required className='h-8 text-xs' /></div>
      </div>
      <div className='grid gap-1'><Label htmlFor='nr-state' className='text-xs'>State (optional)</Label><Input id='nr-state' name='state' placeholder='NY' className='h-8 text-xs' /></div>
      {state.error ? <p className='text-destructive text-xs'>{state.error}</p> : null}
      <div className='flex items-center gap-2'>
        <Button type='submit' size='sm' className='h-7 text-xs'>Save</Button>
        <Button type='button' variant='outline' size='sm' className='h-7 text-xs' onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

function EditRateForm({ rate, onDone }: { rate: TaxRate; onDone: () => void }) {
  const [state, formAction] = useActionState<TaxFormState, FormData>(saveTaxRateAction, {});
  useFormDone(state, onDone);
  return (
    <form action={formAction} className='flex flex-col gap-2'>
      <input type='hidden' name='id' value={rate.id} />
      <div className='grid grid-cols-3 gap-2'>
        <div className='grid gap-1'><Label htmlFor='er-name' className='text-xs'>Name</Label><Input id='er-name' name='name' defaultValue={rate.name} required className='h-8 text-xs' /></div>
        <div className='grid gap-1'><Label htmlFor='er-country' className='text-xs'>Country</Label><Input id='er-country' name='country' defaultValue={rate.country} required className='h-8 text-xs' /></div>
        <div className='grid gap-1'><Label htmlFor='er-rateBps' className='text-xs'>Rate (bps)</Label><Input id='er-rateBps' name='rateBps' type='number' min={0} defaultValue={rate.rateBps} required className='h-8 text-xs' /></div>
      </div>
      <div className='grid gap-1'><Label htmlFor='er-state' className='text-xs'>State (optional)</Label><Input id='er-state' name='state' defaultValue={rate.state ?? ''} className='h-8 text-xs' /></div>
      {state.error ? <p className='text-destructive text-xs'>{state.error}</p> : null}
      <div className='flex items-center gap-2'>
        <Button type='submit' size='sm' className='h-7 text-xs'>Save</Button>
        <Button type='button' variant='outline' size='sm' className='h-7 text-xs' onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

export function TaxManager({ classes, rates }: { classes: TaxClass[]; rates: TaxRate[] }) {
  const [addingClass, setAddingClass] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [addingRate, setAddingRate] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);

  return (
    <div className='flex max-w-3xl flex-col gap-6'>
      <div>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='text-sm font-semibold'>Tax classes</h3>
          {!addingClass ? <Button size='sm' variant='outline' className='h-7 text-xs' onClick={() => setAddingClass(true)}>Add class</Button> : null}
        </div>
        {addingClass ? <Card className='mb-2'><CardContent className='p-3'><CreateClassForm onDone={() => setAddingClass(false)} /></CardContent></Card> : null}
        <Card>
          <CardContent className='divide-border divide-y p-0'>
            {classes.length === 0 && !addingClass ? <p className='text-muted-foreground p-4 text-sm'>No tax classes configured.</p> : classes.map((c) => (
              <div key={c.id} className='px-4 py-3'>
                {editingClassId === c.id ? <EditClassForm cls={c} onDone={() => setEditingClassId(null)} /> : (
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>{c.name}{c.isDefault ? <span className='text-muted-foreground text-xs ml-1'>· default</span> : null}</div>
                      <div className='text-muted-foreground text-xs'>{(c.rateBps / 100).toFixed(1)}%</div>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Button size='sm' variant='ghost' className='h-7 text-xs' onClick={() => setEditingClassId(c.id)}>Edit</Button>
                      <ConfirmAction
                        trigger={<Button size='sm' variant='ghost' className='h-7 text-xs text-destructive'>Delete</Button>}
                        title='Delete tax class'
                        description={`Delete "${c.name}"? This cannot be undone.`}
                        destructive
                        onConfirm={async () => { await removeTaxClassAction(c.id); }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='text-sm font-semibold'>Tax rates</h3>
          {!addingRate ? <Button size='sm' variant='outline' className='h-7 text-xs' onClick={() => setAddingRate(true)}>Add rate</Button> : null}
        </div>
        {addingRate ? <Card className='mb-2'><CardContent className='p-3'><CreateRateForm onDone={() => setAddingRate(false)} /></CardContent></Card> : null}
        <Card>
          <CardContent className='divide-border divide-y p-0'>
            {rates.length === 0 && !addingRate ? <p className='text-muted-foreground p-4 text-sm'>No tax rates configured.</p> : rates.map((r) => (
              <div key={r.id} className='px-4 py-3'>
                {editingRateId === r.id ? <EditRateForm rate={r} onDone={() => setEditingRateId(null)} /> : (
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium text-sm'>{r.name}</div>
                      <div className='text-muted-foreground text-xs'>{r.country}{r.state ? `, ${r.state}` : ''} · {(r.rateBps / 100).toFixed(1)}%</div>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Button size='sm' variant='ghost' className='h-7 text-xs' onClick={() => setEditingRateId(r.id)}>Edit</Button>
                      <ConfirmAction
                        trigger={<Button size='sm' variant='ghost' className='h-7 text-xs text-destructive'>Delete</Button>}
                        title='Delete tax rate'
                        description={`Delete "${r.name}"?`}
                        destructive
                        onConfirm={async () => { await removeTaxRateAction(r.id); }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
