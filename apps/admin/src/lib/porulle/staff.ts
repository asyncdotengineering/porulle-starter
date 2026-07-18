import 'server-only';
import { porulle } from './client';

// Shapes mirror @porulle/core 0.10.2 interfaces/rest/routes/admin/staff.js. `id`
// is the Better Auth member id (not user id). `role` is a string validated by the
// backend (owner/admin/member + any config.auth.roles keys). The roles endpoint
// returns role strings (no ids).

export interface StaffMember {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export interface StaffRole {
  role: string;
  permissions: string[];
}

export interface StaffInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
}

interface ApiResult {
  data?: unknown;
  error?: { error?: { message?: string } };
}

function errMsg(res: ApiResult, fallback: string): string {
  return res.error?.error?.message ?? fallback;
}

interface RawMember {
  id: string;
  userId?: string;
  email?: string;
  name?: string | null;
  role?: string;
  createdAt?: string;
}

interface RawRole {
  role?: string;
  permissions?: string[];
}

interface RawInvitation {
  id: string;
  email?: string;
  role?: string;
  status?: string;
  expiresAt?: string;
}

function toMember(m: RawMember): StaffMember {
  return {
    id: m.id,
    userId: m.userId ?? '',
    email: m.email ?? '',
    name: m.name ?? null,
    role: m.role ?? 'member',
    createdAt: m.createdAt ?? ''
  };
}

export async function listStaff(): Promise<StaffMember[]> {
  const res = (await porulle.GET('/api/admin/staff', {} as never)) as ApiResult;
  if (res.error) throw new Error(errMsg(res, 'Failed to load staff members.'));
  const items = ((res.data as { data?: RawMember[] })?.data ?? []) as RawMember[];
  return items.map(toMember);
}

export async function listStaffRoles(): Promise<StaffRole[]> {
  const res = (await porulle.GET('/api/admin/staff/roles', {} as never)) as ApiResult;
  if (res.error) throw new Error(errMsg(res, 'Failed to load staff roles.'));
  const items = ((res.data as { data?: RawRole[] })?.data ?? []) as RawRole[];
  return items.map((r) => ({ role: r.role ?? '', permissions: r.permissions ?? [] }));
}

export async function listStaffInvitations(): Promise<StaffInvitation[]> {
  const res = (await porulle.GET('/api/admin/staff/invitations', {} as never)) as ApiResult;
  if (res.error) throw new Error(errMsg(res, 'Failed to load staff invitations.'));
  const items = ((res.data as { data?: RawInvitation[] })?.data ?? []) as RawInvitation[];
  return items.map((i) => ({
    id: i.id,
    email: i.email ?? '',
    role: i.role ?? 'member',
    status: i.status ?? 'pending',
    expiresAt: i.expiresAt ?? ''
  }));
}

export interface InviteStaffInput {
  email: string;
  role: string;
}

export async function inviteStaff(input: InviteStaffInput): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/admin/staff/invitations', { body: input } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to invite staff member.') } : {};
}

export async function updateStaffRole(id: string, role: string): Promise<{ error?: string }> {
  const res = (await porulle.PATCH('/api/admin/staff/{id}', {
    params: { path: { id } },
    body: { role }
  } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to update staff role.') } : {};
}

export async function revokeStaff(id: string): Promise<{ error?: string }> {
  const res = (await porulle.DELETE('/api/admin/staff/{id}', {
    params: { path: { id } }
  } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to revoke staff member.') } : {};
}
