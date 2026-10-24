import type { Role } from "@/lib/data/types";

/**
 * Seeded demo logins shown on /login. All share one password.
 * Hide the card in production with NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false.
 */
export const DEMO_PASSWORD = "Demo@1234";

export const DEMO_ACCOUNTS: readonly { role: Role; label: string; email: string; blurb: string }[] = [
  { role: "seeker", label: "Seeker", email: "seeker@demo.com", blurb: "Saved homes, viewings, offers" },
  { role: "owner", label: "Owner / Seller", email: "owner@demo.com", blurb: "Own listings and enquiries" },
  { role: "agent", label: "Agent", email: "agent@demo.com", blurb: "Leads pipeline and calendar" },
  { role: "agency_admin", label: "Agency Admin", email: "agency@demo.com", blurb: "Team, listings, analytics" },
  { role: "admin", label: "Platform Admin", email: "admin@demo.com", blurb: "Verification and moderation" },
];

export const showDemoAccounts = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== "false";
