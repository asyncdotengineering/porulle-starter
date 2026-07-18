import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CheckoutClient } from "@/components/checkout/checkout-client";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Spinner } from "@/components/ui/spinner";
import { getCart } from "@/lib/commerce/operations/cart";
import { getLocale } from "@/lib/params";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

async function CheckoutContent() {
  const [cart, locale] = await Promise.all([getCart(), getLocale()]);
  if (!cart || cart.totalQuantity === 0) {
    redirect("/cart");
  }

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;

  return (
    <Container>
      <h1 className="text-2xl font-semibold tracking-tight mb-8">Checkout</h1>
      <CheckoutClient cart={cart} locale={locale} publishableKey={publishableKey} />
    </Container>
  );
}

export default function CheckoutPage() {
  return (
    <Page className="pt-2.5 md:pt-10">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </Page>
  );
}
