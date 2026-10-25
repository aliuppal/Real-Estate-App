import "server-only";
import { z } from "zod";
import type { Listing, PublicUser, Role } from "@/lib/data/types";
import { getCurrentUser } from "./session";

/** An expected failure whose message is safe to show the user. */
export class ActionError extends Error {}

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

/** Resolves the signed-in user from the session (never from client input) and checks their role. */
export async function actionUser(roles?: readonly Role[]): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new ActionError("Please sign in first.");
  if (roles && !roles.includes(user.role)) throw new ActionError("Your account can't do that.");
  return user;
}

/**
 * Wraps a server action body: validation and permission errors become `{ ok: false, error }`,
 * anything unexpected is logged and reported generically.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Check the form and try again." };
    console.error("[action]", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** Who may edit a listing: its owner, its agent, that agent's agency admin, or a platform admin. */
export function canManageListing(user: PublicUser, listing: Listing): boolean {
  switch (user.role) {
    case "admin":
      return true;
    case "owner":
      return listing.ownerId === user.id;
    case "agent":
      return !!user.agentId && listing.agentId === user.agentId;
    case "agency_admin":
      return !!user.agencyId && listing.agencyId === user.agencyId;
    default:
      return false;
  }
}

export function assertCanManage(user: PublicUser, listing: Listing | null): asserts listing is Listing {
  if (!listing) throw new ActionError("That listing no longer exists.");
  if (!canManageListing(user, listing)) throw new ActionError("You can only change your own listings.");
}
