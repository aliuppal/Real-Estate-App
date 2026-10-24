import type { Role } from "@/lib/data/types";

/** Edge-safe (no data access): imported by middleware. */

export const ROLE_HOME: Record<Role, string> = {
  seeker: "/dashboard/seeker",
  owner: "/dashboard/owner",
  agent: "/dashboard/agent",
  agency_admin: "/dashboard/agency",
  admin: "/dashboard/admin",
};

type Rule = { prefix: string; roles: readonly Role[] | "any" };

/** Most specific first. Anything not matched here is public. */
const RULES: Rule[] = [
  { prefix: "/dashboard/seeker", roles: ["seeker"] },
  { prefix: "/dashboard/owner", roles: ["owner"] },
  { prefix: "/dashboard/agent", roles: ["agent"] },
  { prefix: "/dashboard/agency", roles: ["agency_admin"] },
  { prefix: "/dashboard/admin", roles: ["admin"] },
  { prefix: "/dashboard/listings", roles: ["owner", "agent", "agency_admin"] },
  { prefix: "/dashboard", roles: "any" },
];

// Segment-aware so "/dashboard/agent" doesn't match "/dashboard/agency".
const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const ruleFor = (pathname: string) => RULES.find((r) => matches(pathname, r.prefix)) ?? null;

export const isProtected = (pathname: string) => ruleFor(pathname) !== null;

export function canAccess(pathname: string, role: Role | undefined): boolean {
  const rule = ruleFor(pathname);
  if (!rule) return true;
  if (!role) return false;
  return rule.roles === "any" || rule.roles.includes(role);
}

/** Roles that can create listings (the "Sell" flow). */
export const LISTER_ROLES: readonly Role[] = ["owner", "agent", "agency_admin"];
