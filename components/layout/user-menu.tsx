"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bell, LayoutDashboard, LogOut, MessageSquare, Settings } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROLE_HOME } from "@/lib/auth/roles";
import { roleLabels } from "@/lib/labels";
import type { Role } from "@/lib/data/types";
import { signOutAction } from "./actions";

export type NavUser = { name: string; email: string; avatar: string | null; role: Role };

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");

export function UserMenu({ user }: { user: NavUser }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar className="size-9 ring-2 ring-background/60">
          {user.avatar && <AvatarImage src={user.avatar} alt="" />}
          <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="py-2">
            <p className="truncate font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs font-normal">{user.email}</p>
            <p className="mt-1 text-xs font-normal text-primary">{roleLabels[user.role]}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={ROLE_HOME[user.role]} />}>
          <LayoutDashboard /> Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/messages" />}>
          <MessageSquare /> Messages
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/notifications" />}>
          <Bell /> Notifications
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onClick={() => startTransition(() => signOutAction())}>
          <LogOut /> {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
