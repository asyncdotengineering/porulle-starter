import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { porulle } from "@/lib/commerce/client";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function verifyOrder(orderNumber: string): Promise<{ ok: boolean; status?: string }> {
  try {
    const res = await porulle.GET("/api/orders/{idOrNumber}", {
      params: { path: { idOrNumber: orderNumber } },
    } as never);
    const data = (res as { data?: { data?: { status?: string } } }).data?.data;
    return { ok: !!data, status: data?.status };
  } catch {
    return { ok: false };
  }
}

async function Confirmation({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderNumber = single(params.order);
  const failed = single(params.redirect_status) === "failed";

  if (failed) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Payment didn&apos;t go through</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Your payment could not be completed. No charge was made — please try again.
        </p>
        <Button asChild className="mt-8">
          <Link href="/cart">Back to cart</Link>
        </Button>
      </>
    );
  }

  const verified = orderNumber ? await verifyOrder(orderNumber) : null;
  const displayNumber = verified?.ok ? orderNumber : undefined;

  return (
    <>
      <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-foreground text-background">✓</div>
      <h1 className="text-2xl font-semibold tracking-tight">Thank you for your order</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {displayNumber
          ? `Your order ${displayNumber} is confirmed. A receipt is on its way.`
          : "Your order is confirmed. A receipt is on its way."}
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Continue shopping</Link>
      </Button>
    </>
  );
}

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Page>
      <Container className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <Suspense fallback={<p className="text-muted-foreground">Confirming your order…</p>}>
          <Confirmation searchParams={searchParams} />
        </Suspense>
      </Container>
    </Page>
  );
}
