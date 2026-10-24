import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AgencySignupForm } from "@/components/features/auth/agency-signup-form";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Register your agency" };

export default async function AgencySignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <>
      <p className="mono-label text-meta">For agencies</p>
      <h1 className="mt-3 text-5xl">Register your agency</h1>
      <p className="mt-3 text-muted-foreground">
        Manage your team, listings and leads in one place. Just you?{" "}
        <Link href="/signup?role=agent" className="text-link underline-offset-4 hover:underline">Join as an agent</Link>
      </p>
      <div className="mt-8">
        <AgencySignupForm />
      </div>
    </>
  );
}
