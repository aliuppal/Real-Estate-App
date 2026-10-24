import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { googleEnabled, signIn } from "@/auth";
import { LoginForm } from "@/components/features/auth/login-form";
import { showDemoAccounts } from "@/config/demo-accounts";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ callbackUrl?: string; reset?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl, reset } = await searchParams;
  // Verified against the repository, so a stale cookie (e.g. after a mock-data restart) still sees the form.
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  async function googleAction() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard" });
  }

  return (
    <>
      <p className="mono-label text-meta">Welcome back</p>
      <h1 className="mt-3 text-5xl">Sign in</h1>
      <p className="mt-3 text-muted-foreground">
        New to Nestly?{" "}
        <Link href="/signup" className="text-link underline-offset-4 hover:underline">Create an account</Link>
      </p>
      {reset && <p role="status" className="mt-6 rounded-lg bg-brand-soft px-3.5 py-2.5 text-sm">Password updated. Sign in with your new password.</p>}
      <div className="mt-8">
        <LoginForm callbackUrl={callbackUrl} showDemo={showDemoAccounts} googleAction={googleEnabled ? googleAction : undefined} />
      </div>
    </>
  );
}
