'use client';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import type { DraftOrderAddress, DraftOrderLine, OrderQuote } from '@/lib/porulle/orders';
import {
  createDraftOrderAction,
  quoteDraftOrderAction,
  searchOrderableAction,
  type OrderableProduct
} from './actions';

const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export function DraftOrderForm() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<OrderableProduct[]>([]);
  const [lines, setLines] = useState<DraftOrderLine[]>([]);
  const [addr, setAddr] = useState<DraftOrderAddress>({ line1: '', city: '', state: '', postalCode: '', country: '' });
  const [promo, setPromo] = useState('');
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [quoting, startQuote] = useTransition();
  const [creating, startCreate] = useTransition();

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => startSearch(async () => setResults(await searchOrderableAction(q))), 200);
    return () => clearTimeout(t);
  }, [q]);

  // The address is only complete enough to affect tax/shipping once country + postal are set.
  const hasAddress = Boolean(addr.line1 && addr.city && addr.postalCode && addr.country);
  const promotionCodes = promo.trim() ? [promo.trim().toUpperCase()] : undefined;

  // Live, authoritative quote from porulle (same math as checkout) — debounced.
  useEffect(() => {
    if (lines.length === 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    const t = setTimeout(() => {
      startQuote(async () => {
        const res = await quoteDraftOrderAction({
          lines,
          ...(hasAddress ? { shippingAddress: addr } : {}),
          ...(promotionCodes ? { promotionCodes } : {}),
        });
        setQuoteError(res.error ?? null);
        setQuote(res.quote ?? null);
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, addr.line1, addr.city, addr.state, addr.postalCode, addr.country, promo]);

  function addLine(p: OrderableProduct) {
    setQ('');
    setResults([]);
    setLines((cur) => {
      const existing = cur.find((l) => l.entityId === p.entityId);
      if (existing) return cur.map((l) => (l.entityId === p.entityId ? { ...l, quantity: l.quantity + 1 } : l));
      return [...cur, { entityId: p.entityId, title: p.title, quantity: 1, unitPrice: p.unitPrice }];
    });
  }

  function setQty(entityId: string, raw: number) {
    const quantity = Number.isNaN(raw) || raw < 1 ? 1 : Math.floor(raw);
    setLines((cur) => cur.map((l) => (l.entityId === entityId ? { ...l, quantity } : l)));
  }

  function remove(entityId: string) {
    setLines((cur) => cur.filter((l) => l.entityId !== entityId));
  }

  function create() {
    startCreate(async () => {
      const result = await createDraftOrderAction({
        lines,
        ...(hasAddress ? { shippingAddress: addr } : {}),
        ...(promotionCodes ? { promotionCodes } : {}),
      });
      if (result?.error) toast.error(result.error);
    });
  }

  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);

  return (
    <div className='flex max-w-2xl flex-col gap-4'>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Add products</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='relative'>
            <Input placeholder='Search products…' value={q} onChange={(e) => setQ(e.target.value)} />
            {results.length > 0 ? (
              <div className='bg-popover absolute z-10 mt-1 w-full rounded-md border shadow-md'>
                {results.map((p) => (
                  <button
                    key={p.entityId}
                    type='button'
                    className='hover:bg-accent flex w-full items-center justify-between px-3 py-2 text-left text-sm'
                    onClick={() => addLine(p)}
                  >
                    <span>{p.title}</span>
                    <span className='text-muted-foreground'>{p.priceLabel}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {searching ? <p className='text-muted-foreground text-xs'>Searching…</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Shipping address &amp; discount</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p className='text-muted-foreground text-xs'>
            Tax and shipping are computed by the store once a country + postal code are set.
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <div className='col-span-2 grid gap-1'><Label htmlFor='do-line1' className='text-xs'>Address</Label><Input id='do-line1' value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} placeholder='123 Main St' className='h-8 text-xs' /></div>
            <div className='grid gap-1'><Label htmlFor='do-city' className='text-xs'>City</Label><Input id='do-city' value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className='h-8 text-xs' /></div>
            <div className='grid gap-1'><Label htmlFor='do-state' className='text-xs'>State</Label><Input id='do-state' value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} placeholder='CA' className='h-8 text-xs' /></div>
            <div className='grid gap-1'><Label htmlFor='do-postal' className='text-xs'>Postal code</Label><Input id='do-postal' value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} className='h-8 text-xs' /></div>
            <div className='grid gap-1'><Label htmlFor='do-country' className='text-xs'>Country</Label><Input id='do-country' value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} placeholder='US' className='h-8 text-xs' /></div>
          </div>
          <div className='grid gap-1'><Label htmlFor='do-promo' className='text-xs'>Discount code (optional)</Label><Input id='do-promo' value={promo} onChange={(e) => setPromo(e.target.value)} placeholder='SAVE20' className='h-8 text-xs' /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Items</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {lines.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No items yet.</p>
          ) : (
            lines.map((l) => (
              <div key={l.entityId} className='flex items-center gap-3'>
                <span className='flex-1 text-sm font-medium'>{l.title}</span>
                <Input type='number' min={1} value={l.quantity} onChange={(e) => setQty(l.entityId, Number(e.target.value))} className='w-20' />
                <span className='text-muted-foreground w-20 text-right text-sm tabular-nums'>{money(l.unitPrice * l.quantity)}</span>
                <Button variant='ghost' size='icon' className='size-8' onClick={() => remove(l.entityId)}>
                  <Icons.trash className='size-4' />
                </Button>
              </div>
            ))
          )}
          <div className='space-y-1 border-t pt-3 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Subtotal</span>
              <span className='tabular-nums'>{money(quote?.subtotal ?? subtotal)}</span>
            </div>
            {quote && quote.discountTotal > 0 ? (
              <div className='flex justify-between text-emerald-600'>
                <span>Discount</span>
                <span className='tabular-nums'>&minus;{money(quote.discountTotal)}</span>
              </div>
            ) : null}
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Shipping</span>
              <span className='tabular-nums'>{quote ? money(quote.shippingTotal) : '—'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Tax</span>
              <span className='tabular-nums'>{quote ? money(quote.taxTotal) : '—'}</span>
            </div>
            <div className='flex justify-between font-semibold'>
              <span>Total</span>
              <span className='tabular-nums'>{quote ? money(quote.grandTotal) : '—'}</span>
            </div>
            {quoting ? <p className='text-muted-foreground text-xs'>Pricing…</p> : null}
            {quoteError ? <p className='text-destructive text-xs'>{quoteError}</p> : null}
          </div>
          <Button disabled={creating || lines.length === 0 || Boolean(quoteError)} onClick={create}>
            Create order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
