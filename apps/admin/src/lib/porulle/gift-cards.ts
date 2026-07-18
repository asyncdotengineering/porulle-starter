import 'server-only';
import { porulle } from './client';

export interface AdminGiftCard {
  id: string;
  code: string;
  displayCode: string;
  balance: number;
  initialAmount: number;
  currency: string;
  status: 'active' | 'disabled' | 'exhausted';
  recipientEmail: string | null;
  senderName: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface GiftCardCreateInput {
  amount: number;
  currency: string;
  recipientEmail?: string;
  senderName?: string;
  personalMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface GiftCardAdjustInput {
  delta: number;
  note: string;
}

interface PorulleGiftCard {
  id: string;
  code: string;
  displayCode: string;
  balance: number;
  initialAmount: number;
  currency: string;
  status: 'active' | 'disabled' | 'exhausted';
  recipientEmail?: string | null;
  senderName?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export function money(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function toCard(c: PorulleGiftCard): AdminGiftCard {
  return {
    id: c.id,
    code: c.code,
    displayCode: c.displayCode,
    balance: c.balance,
    initialAmount: c.initialAmount,
    currency: c.currency,
    status: c.status,
    recipientEmail: c.recipientEmail ?? null,
    senderName: c.senderName ?? null,
    expiresAt: c.expiresAt ?? null,
    createdAt: c.createdAt,
  };
}

// Porulle wraps every REST payload in `{ data: ... }`, and the openapi client
// returns `{ data: <body>, error }` — so the payload is `res.data.data`
// (double-unwrap), matching the pattern in tax.ts / orders.ts.
type Wrapped<T> = { data?: { data?: T }; error?: { error?: { message?: string } } };

export async function listGiftCards(): Promise<AdminGiftCard[]> {
  const res = (await porulle.GET('/api/gift-cards', {} as never)) as Wrapped<PorulleGiftCard[]>;
  if (res.error) {
    throw new Error('Failed to load gift cards.');
  }
  const items = res.data?.data ?? [];
  return items.map(toCard);
}

export async function createGiftCard(input: GiftCardCreateInput): Promise<{ error?: string; card?: AdminGiftCard }> {
  const res = (await porulle.POST('/api/gift-cards', {
    body: input,
  } as never)) as Wrapped<PorulleGiftCard>;
  if (res.error) return { error: res.error.error?.message ?? 'Failed to create gift card.' };
  const card = res.data?.data;
  return card ? { card: toCard(card) } : { error: 'Created but no card returned.' };
}

export async function disableGiftCard(id: string): Promise<{ error?: string; card?: AdminGiftCard }> {
  const res = (await porulle.POST('/api/gift-cards/{id}/disable', {
    params: { path: { id } },
  } as never)) as Wrapped<PorulleGiftCard>;
  if (res.error) return { error: res.error.error?.message ?? 'Failed to disable gift card.' };
  const card = res.data?.data;
  return card ? { card: toCard(card) } : { error: 'Disabled but no card returned.' };
}

export async function adjustGiftCard(id: string, input: GiftCardAdjustInput): Promise<{ error?: string; card?: AdminGiftCard }> {
  const res = (await porulle.POST('/api/gift-cards/{id}/adjust', {
    params: { path: { id } },
    body: input,
  } as never)) as Wrapped<PorulleGiftCard>;
  if (res.error) return { error: res.error.error?.message ?? 'Failed to adjust gift card balance.' };
  const card = res.data?.data;
  return card ? { card: toCard(card) } : { error: 'Adjusted but no card returned.' };
}
