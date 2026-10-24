"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutDashboard, MessageSquare, Search, UserRound } from "lucide-react";
import { ROLE_HOME } from "@/lib/auth/roles";
import type { Role } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const loginFor = (path: string) => `/login?callbackUrl=${encodeURIComponent(path)}`;

/** Bottom tab bar on small screens: Home, Search, Saved, Messages, Profile. */
export function MobileTabBar({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const signedIn = role !== null;
  // Only seekers have saved homes; other roles get a shortcut to their dashboard in that slot.
  const third = role && role !== "seeker"
    ? { label: "Dashboard", href: ROLE_HOME[role], icon: LayoutDashboard }
    : { label: "Saved", href: signedIn ? "/dashboard/seeker/saved" : loginFor("/dashboard/seeker/saved"), icon: Heart };

  const tabs = [
    { label: "Home", href: "/", icon: Home },
    { label: "Search", href: "/search", icon: Search },
    third,
    { label: "Messages", href: signedIn ? "/dashboard/messages" : loginFor("/dashboard/messages"), icon: MessageSquare },
    { label: "Profile", href: signedIn ? "/dashboard/settings" : "/login", icon: UserRound },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ label, href, icon: Icon }) => {
          const path = href.split("?")[0];
          const active = path === "/" ? pathname === "/" : pathname.startsWith(path) && !href.startsWith("/login");
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[0.7rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.4]")} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
