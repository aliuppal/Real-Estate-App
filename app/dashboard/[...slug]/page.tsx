import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ComingSoon } from "@/components/layout/coming-soon";
import { requireUser } from "@/lib/auth/session";
import { canAccess, ROLE_HOME } from "@/lib/auth/roles";
import { COMMON_NAV, ROLE_NAV } from "@/components/dashboard/nav-config";

type Props = { params: Promise<{ slug: string[] }> };

const labelFor = (path: string) =>
  [...Object.values(ROLE_NAV).flat(), ...COMMON_NAV].find((i) => i.href === path)?.label;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = `/dashboard/${(await params).slug.join("/")}`;
  return { title: labelFor(path) ?? "Dashboard" };
}

/** Dashboard sections that ship in Phase 2. Role-checked here as well as in middleware. */
export default async function DashboardSectionPage({ params }: Props) {
  const path = `/dashboard/${(await params).slug.join("/")}`;
  const user = await requireUser(path);
  if (!canAccess(path, user.role)) redirect(`${ROLE_HOME[user.role]}?denied=1`);

  return (
    <ComingSoon
      title={labelFor(path) ?? "This section"}
      description="The route and its permissions are in place; the screen itself arrives with the Phase 2 dashboards."
      backHref={ROLE_HOME[user.role]}
      backLabel="Back to overview"
    />
  );
}
