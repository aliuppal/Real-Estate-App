import type { NextAuthConfig } from "next-auth";
import { ROLE_HOME, canAccess, isProtected } from "@/lib/auth/roles";

/**
 * Edge-safe Auth.js config shared by middleware and `auth.ts`.
 * No providers or data access here; those live in `auth.ts` (Node runtime).
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;
      if (!isProtected(pathname)) return true;

      const role = auth?.user?.role;
      // Returning false sends the visitor to /login?callbackUrl=…
      if (!role) return false;

      if (pathname === "/dashboard") return Response.redirect(new URL(ROLE_HOME[role], nextUrl));
      if (!canAccess(pathname, role)) {
        return Response.redirect(new URL(`${ROLE_HOME[role]}?denied=1`, nextUrl));
      }
      return true;
    },

    jwt({ token, user }) {
      // `user` is only present at sign-in; afterwards the token carries the claims.
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.agentId = user.agentId ?? null;
        token.agencyId = user.agencyId ?? null;
      }
      return token;
    },

    session({ session, token }) {
      if (token.id && token.role) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.agentId = token.agentId ?? null;
        session.user.agencyId = token.agencyId ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
