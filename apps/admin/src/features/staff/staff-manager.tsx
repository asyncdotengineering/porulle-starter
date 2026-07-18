'use client';
import { useState, useActionState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmAction } from '@/components/confirm-action';
import type { StaffMember, StaffInvitation, StaffRole } from '@/lib/porulle/staff';
import { inviteStaffAction, changeStaffRoleAction, removeStaffAction, type StaffFormState } from './actions';

function useFormDone(state: StaffFormState, onDone: () => void) {
  const submitted = useRef(false);
  useEffect(() => {
    if (submitted.current && !state.error) onDone();
    submitted.current = true;
  }, [state]);
}

function InviteForm({ roles, onDone }: { roles: StaffRole[]; onDone: () => void }) {
  const [state, formAction] = useActionState<StaffFormState, FormData>(inviteStaffAction, {});
  useFormDone(state, onDone);
  return (
    <form action={formAction} className='flex flex-col gap-2'>
      <div className='grid grid-cols-2 gap-2'>
        <div className='grid gap-1'><Label htmlFor='inv-email' className='text-xs'>Email</Label><Input id='inv-email' name='email' type='email' required className='h-8 text-xs' /></div>
        <div className='grid gap-1'><Label htmlFor='inv-role' className='text-xs'>Role</Label><Input id='inv-role' name='role' required list='role-suggestions' className='h-8 text-xs' /><datalist id='role-suggestions'>{roles.map((r) => <option key={r.role} value={r.role} />)}</datalist></div>
      </div>
      {state.error ? <p className='text-destructive text-xs'>{state.error}</p> : null}
      <div className='flex items-center gap-2'>
        <Button type='submit' size='sm' className='h-7 text-xs'>Invite</Button>
        <Button type='button' variant='outline' size='sm' className='h-7 text-xs' onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

function ChangeRoleForm({ member, roles, onDone }: { member: StaffMember; roles: StaffRole[]; onDone: () => void }) {
  const [state, formAction] = useActionState<StaffFormState, FormData>(changeStaffRoleAction, {});
  useFormDone(state, onDone);
  return (
    <form action={formAction} className='flex items-center gap-2'>
      <input type='hidden' name='id' value={member.id} />
      <Input name='role' defaultValue={member.role} required list='role-suggestions' className='h-7 text-xs w-32' />
      {state.error ? <p className='text-destructive text-xs'>{state.error}</p> : null}
      <Button type='submit' size='sm' className='h-7 text-xs'>Save</Button>
      <Button type='button' variant='outline' size='sm' className='h-7 text-xs' onClick={onDone}>Cancel</Button>
    </form>
  );
}

export function StaffManager({ members, roles, invitations }: { members: StaffMember[]; roles: StaffRole[]; invitations: StaffInvitation[] }) {
  const [addingStaff, setAddingStaff] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  return (
    <div className='flex max-w-3xl flex-col gap-6'>
      <div>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='text-sm font-semibold'>Staff members</h3>
          {!addingStaff ? <Button size='sm' variant='outline' className='h-7 text-xs' onClick={() => setAddingStaff(true)}>Invite staff</Button> : null}
        </div>
        {addingStaff ? <Card className='mb-2'><CardContent className='p-3'><InviteForm roles={roles} onDone={() => setAddingStaff(false)} /></CardContent></Card> : null}
        <Card>
          <CardContent className='divide-border divide-y p-0'>
            {members.length === 0 && !addingStaff ? <p className='text-muted-foreground p-4 text-sm'>No staff members yet.</p> : members.map((s) => (
              <div key={s.id} className='flex items-center justify-between px-4 py-3'>
                <div>
                  <div className='font-medium'>{s.name ?? s.email}</div>
                  {changingRole === s.id ? <ChangeRoleForm member={s} roles={roles} onDone={() => setChangingRole(null)} /> : <div className='text-muted-foreground text-xs'>{s.email} · {s.role}</div>}
                </div>
                <div className='flex items-center gap-1'>
                  {changingRole !== s.id ? (
                    <>
                      <Button size='sm' variant='ghost' className='h-7 text-xs' onClick={() => setChangingRole(s.id)}>Change role</Button>
                      <ConfirmAction trigger={<Button size='sm' variant='ghost' className='h-7 text-xs text-destructive'>Remove</Button>} title='Remove staff member' description={`Revoke ${s.name ?? s.email}'s staff access?`} destructive onConfirm={async () => { await removeStaffAction(s.id); }} />
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {invitations.length > 0 ? (
        <div>
          <h3 className='text-sm font-semibold mb-2'>Pending invitations</h3>
          <Card>
            <CardContent className='divide-border divide-y p-0'>
              {invitations.map((i) => (
                <div key={i.id} className='flex items-center justify-between px-4 py-3'>
                  <div>
                    <div className='font-medium text-sm'>{i.email}</div>
                    <div className='text-muted-foreground text-xs'>{i.role} · {i.status}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div>
        <h3 className='text-sm font-semibold mb-2'>Roles</h3>
        <Card>
          <CardContent className='divide-border divide-y p-0'>
            {roles.length === 0 ? <p className='text-muted-foreground p-4 text-sm'>No roles configured.</p> : roles.map((r) => (
              <div key={r.role} className='px-4 py-3'>
                <div className='font-medium'>{r.role}</div>
                <div className='text-muted-foreground text-xs'>{r.permissions.length > 0 ? r.permissions.join(', ') : 'No permissions'}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
