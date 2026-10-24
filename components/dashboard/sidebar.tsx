"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu, type NavUser } from "@/components/layout/user-menu";
import { roleLabels } from "@/lib/labels";
import { ROLE_HOME } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { COMMON_NAV, ROLE_NAV, type NavItem } from "./nav-config";

function NavList({ items, pathname, home, counts }: { items: NavItem[]; pathname: string; home: string; counts: Record<string, number> }) {
  return (
    <ul className="space-y-0.5">
      {items.map(({ label, href, icon: Icon }) => {
        // The overview link only matches exactly, so it doesn't stay lit on its sub-pages.
        const active = href === home ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span layoutId="dash-nav" className="absolute inset-0 rounded-lg bg-secondary" transition={{ type: "spring", stiffness: 420, damping: 38 }} />
              )}
              <Icon className="relative size-4" strokeWidth={1.7} aria-hidden />
              <span className="relative flex-1">{label}</span>
              {counts[href] ? (
                <span className="relative rounded-full bg-cta px-1.5 text-[0.6875rem] leading-5 text-cta-foreground">{counts[href]}</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardSidebar({ user, unreadMessages, unreadNotifications }: { user: NavUser; unreadMessages: number; unreadNotifications: number }) {
  const pathname = usePathname();
  const home = ROLE_HOME[user.role];
  const counts = { "/dashboard/messages": unreadMessages, "/dashboard/notifications": unreadNotifications };

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-sidebar px-3 py-5 lg:flex">
      <div className="px-3">
        <Logo />
        <p className="mono-label mt-6 text-meta">{roleLabels[user.role]}</p>
      </div>
      <nav aria-label="Dashboard" className="mt-3 flex-1 space-y-6 overflow-y-auto">
        <NavList items={ROLE_NAV[user.role]} pathname={pathname} home={home} counts={counts} />
        <div>
          <p className="mono-label mb-2 px-3 text-[0.6875rem] text-meta">Inbox</p>
          <NavList items={COMMON_NAV} pathname={pathname} home={home} counts={counts} />
        </div>
      </nav>
      <div className="space-y-3 border-t border-border px-1 pt-4">
        <Link href="/" className="flex items-center gap-2 px-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Back to the site
        </Link>
        <div className="flex items-center justify-between px-1">
          <UserMenu user={user} />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
