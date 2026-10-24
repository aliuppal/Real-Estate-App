import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { repo, toPublicUser, type PublicUser, type Role } from "@/lib/data";
import { ROLE_HOME } from "./roles";

/**
 * The signed-in user, re-read from the repository on every request (deduped per render).
 * A valid JWT for a user that no longer exists or is suspended counts as signed out.
 */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await repo.users.findById(session.user.id);
  if (!user || user.status !== "active") return null;
  return toPublicUser(user);
});

export async function requireUser(callbackUrl?: string): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login");
  return user;
}

/** Use in every role-scoped page, layout and server action. Never trust the client's role claim. */
export async function requireRole(roles: readonly Role[], callbackUrl?: string): Promise<PublicUser> {
  const user = await requireUser(callbackUrl);
  if (!roles.includes(user.role)) redirect(`${ROLE_HOME[user.role]}?denied=1`);
  return user;
}
