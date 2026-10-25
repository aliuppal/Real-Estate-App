import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col px-5 py-6 sm:px-10">
      <Logo />
      <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center py-16 text-center">
        <p className="mono-label text-meta">Error 404</p>
        <h1 className="mt-4 text-6xl sm:text-7xl">This page moved out.</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          The listing may have been sold, rented or taken down, or the link is mistyped.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/search" className={buttonVariants({ size: "xl" })}>Search homes</Link>
          <Link href="/" className={buttonVariants({ size: "xl", variant: "outline" })}>Back to home</Link>
        </div>
      </div>
    </main>
  );
}
