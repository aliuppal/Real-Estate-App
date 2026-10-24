"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu, type NavUser } from "./user-menu";

interface SiteHeaderProps {
  user: NavUser | null;
  unreadNotifications: number;
}

/**
 * Fixed glass header that solidifies on scroll. The solid state is a separate layer whose
 * opacity is the only thing that transitions, so the change is compositor-only.
 */
export function SiteHeader({ user, unreadNotifications }: SiteHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 12));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (pathname !== path) return false;
    if (!query) return true;
    return [...new URLSearchParams(query)].every(([k, v]) => searchParams.get(k) === v);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div aria-hidden className="absolute inset-0 bg-background/70 backdrop-blur-xl" />
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 border-b border-hairline bg-background transition-opacity duration-300 ease-[var(--ease-out-quint)]",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {site.mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="rounded-full px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline aria-[current=page]:underline-offset-8"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />

          {user ? (
            <>
              <Link
                href="/dashboard/notifications"
                aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : "Notifications"}
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative hidden rounded-full sm:inline-flex")}
              >
                <Bell className="size-[1.1rem]" />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-cta px-1 text-[0.625rem] font-semibold leading-4 text-cta-foreground">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link href="/login" className="hidden px-3 text-sm underline-offset-4 hover:underline sm:inline">
                Sign in
              </Link>
              <Link href="/dashboard/listings/new" className={cn(buttonVariants(), "hidden h-10 rounded-full px-5 lg:inline-flex")}>
                List a property
              </Link>
            </>
          )}

          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" aria-label="Open menu" className="rounded-full md:hidden" />}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="mono-label text-meta">Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {[...site.mainNav, { label: "Find my agent", href: "/match" }].map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2.5 text-lg hover:bg-muted">
                    {item.label}
                  </Link>
                ))}
                {!user && (
                  <Link href="/login" className={cn(buttonVariants({ size: "xl" }), "mt-4")}>Sign in</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
