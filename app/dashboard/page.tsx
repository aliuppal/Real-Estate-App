import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";

/** Middleware already sends /dashboard to the role's home; this covers direct server renders. */
export default async function DashboardIndex() {
  const user = await requireUser("/dashboard");
  redirect(ROLE_HOME[user.role]);
}
