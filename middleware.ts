import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Role-based route protection (see lib/auth/roles.ts). Server components and actions re-check
 * with `requireRole`, so this is the first line of defence, not the only one.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/dashboard/:path*"],
};
