import NextAuth, { type User as AuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { repo, type User } from "@/lib/data";
import { loginSchema } from "@/lib/validation/auth";

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

/** The only user fields that go into the JWT. Role always comes from our data, never the client. */
const toAuthUser = (u: User): AuthUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  image: u.avatar,
  role: u.role,
  agentId: u.agentId,
  agencyId: u.agencyId,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await repo.users.findByEmail(parsed.data.email);
        if (!user?.passwordHash || user.status !== "active") return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        return ok ? toAuthUser(user) : null;
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;
      const existing = await repo.users.findByEmail(user.email);
      return !existing || existing.status === "active";
    },

    async jwt(params) {
      // Google accounts: find or create the matching Nestly user (new ones start as seekers).
      if (params.account?.provider === "google" && params.user?.email) {
        const email = params.user.email;
        const user =
          (await repo.users.findByEmail(email)) ??
          (await repo.users.create({
            name: params.user.name ?? email.split("@")[0],
            email,
            passwordHash: null,
            role: "seeker",
            avatar: params.user.image ?? null,
          }));
        params.user = toAuthUser(user);
      }
      return authConfig.callbacks.jwt(params);
    },
  },
});
