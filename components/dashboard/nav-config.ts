import {
  BadgeCheck, Bell, Building2, CalendarDays, ChartLine, Columns3, Flag, Heart, Home, KanbanSquare,
  LayoutGrid, MessageSquare, PlusCircle, Search, Settings, ShieldCheck, Star, UserCog, Users, Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/data/types";
import { ROLE_HOME } from "@/lib/auth/roles";

export type NavItem = { label: string; href: string; icon: LucideIcon };

const overview = (role: Role): NavItem => ({ label: "Overview", href: ROLE_HOME[role], icon: LayoutGrid });

export const ROLE_NAV: Record<Role, NavItem[]> = {
  seeker: [
    overview("seeker"),
    { label: "Saved homes", href: "/dashboard/seeker/saved", icon: Heart },
    { label: "Compare", href: "/dashboard/seeker/compare", icon: Columns3 },
    { label: "Saved searches", href: "/dashboard/seeker/searches", icon: Search },
    { label: "Viewings", href: "/dashboard/seeker/viewings", icon: CalendarDays },
    { label: "Offers & applications", href: "/dashboard/seeker/offers", icon: Wallet },
  ],
  owner: [
    overview("owner"),
    { label: "My listings", href: "/dashboard/owner/listings", icon: Home },
    { label: "New listing", href: "/dashboard/listings/new", icon: PlusCircle },
    { label: "Viewings", href: "/dashboard/owner/viewings", icon: CalendarDays },
    { label: "Offers", href: "/dashboard/owner/offers", icon: Wallet },
    { label: "Performance", href: "/dashboard/owner/performance", icon: ChartLine },
  ],
  agent: [
    overview("agent"),
    { label: "Lead pipeline", href: "/dashboard/agent/leads", icon: KanbanSquare },
    { label: "Calendar", href: "/dashboard/agent/calendar", icon: CalendarDays },
    { label: "My listings", href: "/dashboard/agent/listings", icon: Home },
    { label: "New listing", href: "/dashboard/listings/new", icon: PlusCircle },
    { label: "Reviews", href: "/dashboard/agent/reviews", icon: Star },
  ],
  agency_admin: [
    overview("agency_admin"),
    { label: "Team", href: "/dashboard/agency/team", icon: Users },
    { label: "Listings", href: "/dashboard/agency/listings", icon: Home },
    { label: "Analytics", href: "/dashboard/agency/analytics", icon: ChartLine },
    { label: "Agency profile", href: "/dashboard/agency/profile", icon: Building2 },
  ],
  admin: [
    overview("admin"),
    { label: "Verification queue", href: "/dashboard/admin/verification", icon: BadgeCheck },
    { label: "Listing moderation", href: "/dashboard/admin/moderation", icon: ShieldCheck },
    { label: "Reports", href: "/dashboard/admin/reports", icon: Flag },
    { label: "Users", href: "/dashboard/admin/users", icon: UserCog },
  ],
};

export const COMMON_NAV: NavItem[] = [
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];
