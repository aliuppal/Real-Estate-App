import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { UserTable } from "@/components/features/manage/admin-panels";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  await requireRole(["admin"]);
  const users = (await repo.users.list()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <DashboardHeader eyebrow="Platform admin" title="Users" description="Suspended users can't sign in until reactivated." />
      <UserTable users={users} />
    </>
  );
}
