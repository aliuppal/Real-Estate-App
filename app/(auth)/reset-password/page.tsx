import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/features/auth/password-reset-forms";

export const metadata: Metadata = { title: "Choose a new password" };

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <>
      <p className="mono-label text-meta">Account recovery</p>
      <h1 className="mt-3 text-5xl">Choose a new password</h1>
      {token ? (
        <div className="mt-8">
          <ResetPasswordForm token={token} />
        </div>
      ) : (
        <p className="mt-6 text-muted-foreground">
          This link is missing its token.{" "}
          <Link href="/forgot-password" className="text-link underline-offset-4 hover:underline">Request a new reset link</Link>.
        </p>
      )}
    </>
  );
}
