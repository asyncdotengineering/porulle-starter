import { LogInIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { getCustomerSession } from "@/lib/commerce/operations/customer";

export async function AccountLink() {
  const session = await getCustomerSession();
  const isSignedIn = !!session;

  return (
    <Link
      href={isSignedIn ? "/account" : "/login"}
      className="flex items-center justify-center text-foreground hover:text-foreground/80"
      title={isSignedIn ? "My account" : "Sign in"}
    >
      {isSignedIn ? <UserIcon className="size-5" /> : <LogInIcon className="size-5" />}
      <span className="sr-only">{isSignedIn ? "Account" : "Sign in"}</span>
    </Link>
  );
}
