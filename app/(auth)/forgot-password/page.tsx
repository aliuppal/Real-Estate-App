import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/features/auth/password-reset-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <p className="mono-label text-meta">Account recovery</p>
      <h1 className="mt-3 text-5xl">Forgot your password?</h1>
      <p className="mt-3 text-muted-foreground">Enter your email and we&apos;ll send you a link to choose a new one.</p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-link underline-offset-4 hover:underline">Back to sign in</Link>
      </p>
    </>
  );
}
