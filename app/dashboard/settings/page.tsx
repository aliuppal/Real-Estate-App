import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { roleLabels } from "@/lib/labels";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { AgentProfileForm, ProfileForm } from "@/components/features/messages/settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser("/dashboard/settings");
  const [agent, neighbourhoods] = await Promise.all([
    user.agentId ? repo.agents.findById(user.agentId) : null,
    repo.neighbourhoods.list(),
  ]);
  return (
    <>
      <DashboardHeader eyebrow={roleLabels[user.role]} title="Settings" />
      <div className="max-w-3xl space-y-6">
        <ProfileForm name={user.name} email={user.email} phone={user.phone} />
        {agent && <AgentProfileForm agent={agent} areas={neighbourhoods.map((n) => ({ id: n.id, name: n.name }))} />}
      </div>
    </>
  );
}
