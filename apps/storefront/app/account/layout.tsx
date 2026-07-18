import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/commerce/operations/customer";

export const instant = false;

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">My Account</h1>
      <div className="flex flex-col gap-8 md:flex-row">
        <nav className="flex flex-row gap-4 md:w-48 md:flex-col">
          <a href="/account" className="text-sm font-medium hover:underline">Overview</a>
          <a href="/account/orders" className="text-sm font-medium hover:underline">Orders</a>
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
