"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCheckoutAction } from "@/lib/checkout/action";
import type { Cart } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface CheckoutClientProps {
  cart: Cart;
  locale: string;
  publishableKey: string | null;
}

export function CheckoutClient({ cart, locale, publishableKey }: CheckoutClientProps) {
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const currency = cart.cost.totalAmount.currencyCode;
  const total = Number.parseFloat(cart.cost.totalAmount.amount);

  async function handleAddressSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const shippingAddress = {
      line1: String(form.get("line1") ?? ""),
      line2: String(form.get("line2") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
      country: String(form.get("country") ?? "US"),
    };
    const email = String(form.get("email") ?? "");

    const result = await createCheckoutAction({ email, shippingAddress });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Checkout failed.");
      return;
    }

    if (stripePromise && result.clientSecret) {
      setOrderNumber(result.orderNumber ?? null);
      setClientSecret(result.clientSecret);
    } else {
      // No Stripe publishable key configured: the backend dev payment adapter
      // already settled the order. Go straight to the confirmation page.
      router.push(`/checkout/confirmation?order=${result.orderNumber ?? ""}`);
    }
  }

  if (clientSecret && stripePromise) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <PaymentStep orderNumber={orderNumber ?? ""} />
        </Elements>
        <OrderSummary cart={cart} currency={currency} locale={locale} total={total} />
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <form className="grid gap-5" onSubmit={handleAddressSubmit}>
        <h2 className="text-lg font-medium">Shipping details</h2>
        <Field id="email" label="Email" type="email" required />
        <Field id="line1" label="Address" required />
        <Field id="line2" label="Apartment, suite, etc. (optional)" />
        <div className="grid grid-cols-2 gap-4">
          <Field id="city" label="City" required />
          <Field id="state" label="State / Province" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field id="postalCode" label="Postal code" required />
          <Field id="country" label="Country" defaultValue="US" required />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="mt-2" disabled={submitting} type="submit">
          {submitting ? "Processing…" : "Continue to payment"}
        </Button>
      </form>
      <OrderSummary cart={cart} currency={currency} locale={locale} total={total} />
    </div>
  );
}

function PaymentStep({ orderNumber }: { orderNumber: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation?order=${orderNumber}`,
      },
    });
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed.");
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={pay}>
      <h2 className="text-lg font-medium">Payment</h2>
      <PaymentElement />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={!stripe || submitting} type="submit">
        {submitting ? "Processing…" : "Pay now"}
      </Button>
    </form>
  );
}

function OrderSummary({
  cart,
  currency,
  locale,
  total,
}: {
  cart: Cart;
  currency: string;
  locale: string;
  total: number;
}) {
  return (
    <aside className="h-fit rounded-xl border border-border p-5">
      <h2 className="text-lg font-medium mb-4">Order summary</h2>
      <ul className="grid gap-3">
        {cart.lines.map((line) => (
          <li className="flex justify-between gap-4 text-sm" key={line.id}>
            <span className="text-muted-foreground">
              {line.merchandise.product.title}
              {line.merchandise.title !== "Default Title" ? ` · ${line.merchandise.title}` : ""} × {line.quantity}
            </span>
            <span>{formatPrice(Number.parseFloat(line.cost.totalAmount.amount), currency, locale)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between border-t border-border pt-4 font-medium">
        <span>Total</span>
        <span>{formatPrice(total, currency, locale)}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Taxes and shipping calculated at payment.</p>
    </aside>
  );
}

function Field({
  defaultValue,
  id,
  label,
  required,
  type = "text",
}: {
  defaultValue?: string;
  id: string;
  label: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input defaultValue={defaultValue} id={id} name={id} required={required} type={type} />
    </div>
  );
}
