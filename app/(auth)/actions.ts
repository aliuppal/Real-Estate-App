"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { repo } from "@/lib/data";
import { ROLE_HOME } from "@/lib/auth/roles";
import { site } from "@/config/site";
import {
  agencySignupSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema,
} from "@/lib/validation/auth";

export type ActionResult =
  | { ok: true; redirectTo?: string; message?: string; devLink?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

const RESET_TTL_MS = 30 * 60_000;

/**
 * Returns a same-origin path to send the user back to, or null. Auth.js passes absolute URLs,
 * so those are accepted only when their origin matches this request's; `//evil.com` is rejected.
 */
async function safeCallback(url: unknown): Promise<string | null> {
  if (typeof url !== "string" || !url) return null;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${host}`;
  try {
    const parsed = new URL(url, origin);
    if (parsed.origin !== origin) return null;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

async function startSession(email: string, password: string): Promise<boolean> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return true;
  } catch (err) {
    if (err instanceof AuthError) return false;
    throw err;
  }
}

export async function loginAction(raw: unknown, callbackUrl?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };

  const { email, password } = parsed.data;
  if (!(await startSession(email, password))) return { ok: false, error: "That email and password don't match an account." };

  const user = await repo.users.findByEmail(email);
  return { ok: true, redirectTo: (await safeCallback(callbackUrl)) ?? ROLE_HOME[user!.role] };
}

export async function signupAction(raw: unknown): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };

  const { name, email, password, role } = parsed.data;
  if (await repo.users.findByEmail(email)) {
    return { ok: false, error: "An account with this email already exists.", fieldErrors: { email: ["Already registered. Try signing in."] } };
  }
  await repo.users.create({ name, email, role, passwordHash: await bcrypt.hash(password, 10) });
  await startSession(email, password);
  return { ok: true, redirectTo: ROLE_HOME[role] };
}

export async function agencySignupAction(raw: unknown): Promise<ActionResult> {
  const parsed = agencySignupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };

  const { agencyName, name, email, phone, password } = parsed.data;
  if (await repo.users.findByEmail(email)) {
    return { ok: false, error: "An account with this email already exists.", fieldErrors: { email: ["Already registered. Try signing in."] } };
  }
  const agency = await repo.agencies.create({ name: agencyName, email, phone });
  await repo.users.create({ name, email, role: "agency_admin", agencyId: agency.id, passwordHash: await bcrypt.hash(password, 10) });
  await startSession(email, password);
  return { ok: true, redirectTo: ROLE_HOME.agency_admin, message: "Agency registered. We'll verify it within one working day." };
}

/** Always answers the same way so the form can't be used to discover which emails are registered. */
export async function forgotPasswordAction(raw: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };

  const user = await repo.users.findByEmail(parsed.data.email);
  let devLink: string | undefined;
  if (user && user.status === "active") {
    const token = randomBytes(24).toString("hex");
    await repo.passwordResets.create({ token, userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString() });
    const link = `${site.url}/reset-password?token=${token}`;
    // Email delivery is stubbed. In development the link is logged and shown on screen.
    if (process.env.NODE_ENV !== "production") {
      console.info(`[password reset] ${user.email}: ${link}`);
      devLink = link;
    }
  }
  return { ok: true, message: "If that email has an account, a reset link is on its way.", devLink };
}

export async function resetPasswordAction(raw: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };

  const token = await repo.passwordResets.consume(parsed.data.token);
  if (!token) return { ok: false, error: "This reset link has expired or was already used. Request a new one." };

  await repo.users.setPassword(token.userId, await bcrypt.hash(parsed.data.password, 10));
  return { ok: true, redirectTo: "/login?reset=1" };
}
