import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/features/auth/signup-form";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";
import { SIGNUP_ROLES } from "@/lib/validation/auth";

export const metadata: Metadata = { title: "Create an account" };

type Props = { searchParams: Promise<{ role?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  const { role } = await searchParams;
  const defaultRole = SIGNUP_ROLES.find((r) => r === role) ?? "seeker";

  return (
    <>
      <p className="mono-label text-meta">Free forever for home seekers</p>
      <h1 className="mt-3 text-5xl">Create an account</h1>
      <p className="mt-3 text-muted-foreground">
        Already have one?{" "}
        <Link href="/login" className="text-link underline-offset-4 hover:underline">Sign in</Link>
      </p>
      <div className="mt-8">
        <SignupForm defaultRole={defaultRole} />
      </div>
    </>
  );
}
