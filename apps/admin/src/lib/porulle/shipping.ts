import 'server-only';
import { porulle } from './client';

// Shapes mirror @porulle/core 0.10.2 modules/shipping. A rate belongs to a zone
// (zoneId). `amount`/subtotals/threshold are minor units (cents).

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states: string[];
  priority: number;
  isActive: boolean;
  createdAt: string;
}

export interface ShippingRate {
  id: string;
  zoneId: string;
  name: string;
  amount: number;
  currency: string;
  minSubtotal: number | null;
  maxSubtotal: number | null;
  minWeightGrams: number | null;
  maxWeightGrams: number | null;
  freeShippingThreshold: number | null;
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

interface RawZone {
  id: string;
  name: string;
  countries?: string[];
  states?: string[];
  priority?: number;
  isActive?: boolean;
  createdAt?: string;
}

interface RawRate {
  id: string;
  zoneId: string;
  name: string;
  amount?: number;
  currency?: string;
  minSubtotal?: number | null;
  maxSubtotal?: number | null;
  minWeightGrams?: number | null;
  maxWeightGrams?: number | null;
  freeShippingThreshold?: number | null;
  isActive?: boolean;
  createdAt?: string;
}

function toZone(z: RawZone): ShippingZone {
  return {
    id: z.id,
    name: z.name,
    countries: z.countries ?? [],
    states: z.states ?? [],
    priority: z.priority ?? 0,
    isActive: z.isActive ?? true,
    createdAt: z.createdAt ?? ''
  };
}

function toRate(r: RawRate): ShippingRate {
  return {
    id: r.id,
    zoneId: r.zoneId,
    name: r.name,
    amount: r.amount ?? 0,
    currency: r.currency ?? 'USD',
    minSubtotal: r.minSubtotal ?? null,
    maxSubtotal: r.maxSubtotal ?? null,
    minWeightGrams: r.minWeightGrams ?? null,
    maxWeightGrams: r.maxWeightGrams ?? null,
    freeShippingThreshold: r.freeShippingThreshold ?? null,
    isActive: r.isActive ?? true,
    createdAt: r.createdAt ?? ''
  };
}

export async function listShippingZones(): Promise<ShippingZone[]> {
  const res = (await porulle.GET('/api/shipping/zones', {} as never)) as ApiResult;
  if (res.error) throw new Error(errMsg(res, 'Failed to load shipping zones.'));
  const items = ((res.data as { data?: RawZone[] })?.data ?? []) as RawZone[];
  return items.map(toZone);
}

export async function listShippingRates(): Promise<ShippingRate[]> {
  const res = (await porulle.GET('/api/shipping/rates', {} as never)) as ApiResult;
  if (res.error) throw new Error(errMsg(res, 'Failed to load shipping rates.'));
  const items = ((res.data as { data?: RawRate[] })?.data ?? []) as RawRate[];
  return items.map(toRate);
}

export interface ShippingZoneInput {
  name: string;
  countries: string[];
  states?: string[];
  priority?: number;
  isActive?: boolean;
}

export interface ShippingZonePatch {
  name?: string;
  countries?: string[];
  states?: string[];
  priority?: number;
  isActive?: boolean;
}

export interface ShippingRateInput {
  zoneId: string;
  name: string;
  amount: number;
  currency?: string;
  minSubtotal?: number;
  maxSubtotal?: number;
  minWeightGrams?: number;
  maxWeightGrams?: number;
  freeShippingThreshold?: number;
  isActive?: boolean;
}

export interface ShippingRatePatch {
  name?: string;
  amount?: number;
  currency?: string;
  minSubtotal?: number | null;
  maxSubtotal?: number | null;
  minWeightGrams?: number | null;
  maxWeightGrams?: number | null;
  freeShippingThreshold?: number | null;
  isActive?: boolean;
}

export async function createShippingZone(input: ShippingZoneInput): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/shipping/zones', { body: input } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to create shipping zone.') } : {};
}

export async function updateShippingZone(id: string, patch: ShippingZonePatch): Promise<{ error?: string }> {
  const res = (await porulle.PATCH('/api/shipping/zones/{id}', {
    params: { path: { id } },
    body: patch
  } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to update shipping zone.') } : {};
}

export async function deleteShippingZone(id: string): Promise<{ error?: string }> {
  const res = (await porulle.DELETE('/api/shipping/zones/{id}', {
    params: { path: { id } }
  } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to delete shipping zone.') } : {};
}

export async function createShippingRate(input: ShippingRateInput): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/shipping/rates', { body: input } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to create shipping rate.') } : {};
}

export async function updateShippingRate(id: string, patch: ShippingRatePatch): Promise<{ error?: string }> {
  const res = (await porulle.PATCH('/api/shipping/rates/{id}', {
    params: { path: { id } },
    body: patch
  } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to update shipping rate.') } : {};
}

export async function deleteShippingRate(id: string): Promise<{ error?: string }> {
  const res = (await porulle.DELETE('/api/shipping/rates/{id}', {
    params: { path: { id } }
  } as never)) as ApiResult;
  return res.error ? { error: errMsg(res, 'Failed to delete shipping rate.') } : {};
}
