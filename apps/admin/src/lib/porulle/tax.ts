import 'server-only';
import { porulle } from './client';

// Shapes mirror @porulle/core 0.10.2 modules/tax (issue #45 rates, #57 classes).
// Classes carry their own rate (product-classification tax); rates are per-region.
// The two are independent entities — a rate is NOT a child of a class.

export interface TaxClass {
  id: string;
  name: string;
  rateBps: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface TaxRate {
  id: string;
  name: string;
  country: string;
  state: string | null;
  rateBps: number;
  appliesToShipping: boolean;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

interface ApiResult {
  data?: unknown;
  error?: { error?: { message?: string } };
}

function errMsg(res: ApiResult, fallback: string): string {
  return res.error?.error?.message ?? fallback;
}

interface RawClass {
  id: string;
  name: string;
  rateBps?: number;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

interface RawRate {
  id: string;
  name: string;
  country?: string;
  state?: string | null;
  rateBps?: number;
  appliesToShipping?: boolean;
  priority?: number;
  isActive?: boolean;
  createdAt?: string;
}

function toClass(c: RawClass): TaxClass {
  return {
    id: c.id,
    name: c.name,
    rateBps: c.rateBps ?? 0,
    isDefault: c.isDefault ?? false,
    isActive: c.isActive ?? true,
    createdAt: c.createdAt ?? ''
  };
}

function toRate(r: RawRate): TaxRate {
  return {
    id: r.id,
    name: r.name,
    country: r.country ?? '*',
    state: r.state ?? null,
    rateBps: r.rateBps ?? 0,
    appliesToShipping: r.appliesToShipping ?? false,
    priority: r.priority ?? 0,
    isActive: r.isActive ?? true,
    createdAt: r.createdAt ?? ''
  };
}

export async function listTaxClasses(): Promise<TaxClass[]> {
  const res = (await porulle.GET('/api/tax/classes', {} as never)) as ApiResult;
  if (res.error) throw new Error(errMsg(res, 'Failed to load tax classes.'));
  const items = ((res.data as { data?: RawClass[] })?.data ?? []) as RawClass[];
  return items.map(toClass);
}

export async function listTaxRates(): Promise<TaxRate[]> {
  const res = (await porulle.GET('/api/tax/rates', {} as never)) as ApiResult;
  if (res.error) throw new Error(errMsg(res, 'Failed to load tax rates.'));
  const items = ((res.data as { data?: RawRate[] })?.data ?? []) as RawRate[];
  return items.map(toRate);
}

export interface TaxClassInput {
  name: string;
  rateBps: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface TaxClassPatch {
  name?: string;
  rateBps?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface TaxRateInput {
  name: string;
  country: string;
  state?: string;
  rateBps: number;
  appliesToShipping?: boolean;
  priority?: number;
  isActive?: boolean;
}

export interface TaxRatePatch {
  name?: string;
  country?: string;
  state?: string | null;
  rateBps?: number;
  appliesToShipping?: boolean;
  priority?: number;
  isActive?: boolean;
}

export async function createTaxClass(input: TaxClassInput): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/tax/classes', { body: input } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to create tax class.') } : {};
}

export async function updateTaxClass(id: string, patch: TaxClassPatch): Promise<{ error?: string }> {
  const res = (await porulle.PATCH('/api/tax/classes/{id}', {
    params: { path: { id } },
    body: patch
  } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to update tax class.') } : {};
}

export async function deleteTaxClass(id: string): Promise<{ error?: string }> {
  const res = (await porulle.DELETE('/api/tax/classes/{id}', {
    params: { path: { id } }
  } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to delete tax class.') } : {};
}

export async function createTaxRate(input: TaxRateInput): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/tax/rates', { body: input } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to create tax rate.') } : {};
}

export async function updateTaxRate(id: string, patch: TaxRatePatch): Promise<{ error?: string }> {
  const res = (await porulle.PATCH('/api/tax/rates/{id}', {
    params: { path: { id } },
    body: patch
  } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to update tax rate.') } : {};
}

export async function deleteTaxRate(id: string): Promise<{ error?: string }> {
  const res = (await porulle.DELETE('/api/tax/rates/{id}', {
    params: { path: { id } }
  } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to delete tax rate.') } : {};
}
