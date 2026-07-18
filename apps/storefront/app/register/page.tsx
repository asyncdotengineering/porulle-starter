"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUpCustomer } from "@/lib/commerce/operations/customer";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50"
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const name = formData.get("name") as string;
      const result = await signUpCustomer(email, password, name);
      if (result.ok) {
        window.location.href = "/account";
      }
      return result;
    },
    { ok: false, error: "" },
  );

  return (
    <div className="mx-auto w-full max-w-sm py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Create account</h1>
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <SubmitButton />
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/login" className="font-medium underline">Sign in</a>
      </p>
    </div>
  );
}
