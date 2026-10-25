"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

/** Route-level error boundary: keeps the shell, explains, and offers a retry. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section role="alert" className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="mono-label text-meta">Something went wrong</p>
      <h1 className="mt-4 text-5xl">We couldn&apos;t load this page.</h1>
      <p className="mt-4 text-muted-foreground">It&apos;s probably temporary. Try again, and if it keeps happening, come back in a few minutes.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-meta">Reference {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button size="xl" onClick={reset}>Try again</Button>
        <Link href="/" className={buttonVariants({ size: "xl", variant: "outline" })}>Go home</Link>
      </div>
    </section>
  );
}
