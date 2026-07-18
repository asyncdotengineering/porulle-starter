import 'server-only';
import { porulle } from './client';

export interface AdminCustomer {
  createdAt: string;
  email: string;
  id: string;
  name: string;
  phone: string;
}

export interface AdminCustomerOrder {
  id: string;
  orderNumber: string;
  placedAt: string;
  status: string;
  totalLabel: string;
}

interface PorulleCustomer {
  createdAt?: string;
  email?: string | null;
  firstName?: string | null;
  id: string;
  lastName?: string | null;
  phone?: string | null;
}

type ApiResult = { data?: unknown; error?: unknown };

function money(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function displayName(c: PorulleCustomer): string {
  const full = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  return full || c.email || c.phone || `Guest ${c.id.slice(0, 8)}`;
}

function toCustomer(c: PorulleCustomer): AdminCustomer {
  return {
    id: c.id,
    name: displayName(c),
    email: c.email ?? '—',
    phone: c.phone ?? '—',
    createdAt: c.createdAt ?? ''
  };
}

export async function listCustomers(): Promise<AdminCustomer[]> {
  const res = (await porulle.GET('/api/customers', {
    params: { query: { limit: 100 } }
  } as never)) as ApiResult;
  const rows = ((res.data as { data?: PorulleCustomer[] })?.data ?? []) as PorulleCustomer[];
  return rows.map(toCustomer);
}

export async function getCustomer(id: string): Promise<AdminCustomer | null> {
  const res = (await porulle.GET('/api/customers/{id}', {
    params: { path: { id } }
  } as never)) as ApiResult;
  if (res.error) return null;
  const c = (res.data as { data?: PorulleCustomer })?.data;
  return c ? toCustomer(c) : null;
}

export interface AdminInteraction {
  createdAt: string;
  id: string;
  kind: string;
  notes: string;
}

export async function getCustomerInteractions(id: string): Promise<AdminInteraction[]> {
  const res = (await porulle.GET('/api/customers/{id}/interactions', {
    params: { path: { id } }
  } as never)) as ApiResult;
  const rows = ((res.data as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
    Record<string, unknown>
  >;
  return rows.map((r) => ({
    id: String(r.id),
    kind: String(r.kind ?? 'note'),
    notes: String(r.notes ?? ''),
    createdAt: String(r.createdAt ?? '')
  }));
}

export async function addCustomerNote(id: string, notes: string): Promise<{ error?: string }> {
  // porulle's interaction `kind` is an enum (visit|call|inquiry|fitting|follow_up
  // |message); "message" is the generic free-note kind.
  const res = (await porulle.POST('/api/customers/{id}/interactions', {
    params: { path: { id } },
    body: { kind: 'message', notes }
  } as never)) as { error?: { error?: { message?: string } } };
  if (res.error) return { error: res.error.error?.message ?? 'Failed to add note.' };
  return {};
}

export async function getCustomerOrders(id: string): Promise<AdminCustomerOrder[]> {
  const res = (await porulle.GET('/api/customers/{id}/orders', {
    params: { path: { id }, query: { limit: 100 } }
  } as never)) as ApiResult;
  const rows = ((res.data as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
    Record<string, unknown>
  >;
  return rows.map((o) => ({
    id: String(o.id),
    orderNumber: String(o.orderNumber ?? String(o.id).slice(0, 8)),
    status: String(o.status ?? 'pending'),
    totalLabel: money(Number(o.grandTotal ?? 0), String(o.currency ?? 'USD')),
    placedAt: String(o.placedAt ?? o.createdAt ?? '')
  }));
}
