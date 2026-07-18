import { signOutCustomer, getCustomerProfile } from "@/lib/commerce/operations/customer";

export default async function AccountPage() {
  const profile = await getCustomerProfile();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4">
        <h2 className="text-lg font-medium">Profile</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{profile?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">
              {profile?.firstName ?? profile?.lastName
                ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
                : "—"}
            </dd>
          </div>
        </dl>
      </div>
      <form action={signOutCustomer}>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
