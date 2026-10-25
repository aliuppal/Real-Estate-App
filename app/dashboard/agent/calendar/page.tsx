import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { viewingRows } from "@/lib/dashboard-data";
import { VIEWING_HOURS, formatInLahore, viewingSlots } from "@/lib/availability";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { ViewingList } from "@/components/features/manage/viewing-list";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar" };

export default async function AgentCalendarPage() {
  const user = await requireRole(["agent"]);
  if (!user.agentId) notFound();
  const viewings = await repo.viewings.forAgent(user.agentId);
  const week = viewingSlots(viewings, 7);

  return (
    <>
      <DashboardHeader eyebrow="Agent" title="Calendar"
        description={`Seekers book from your open slots: Monday to Saturday, ${VIEWING_HOURS.start}:00–${VIEWING_HOURS.end}:00 Lahore time.`} />
      <section aria-label="Availability this week" className="mb-12 overflow-x-auto rounded-media border border-border bg-card p-4">
        <div className="grid min-w-[640px] grid-cols-7 gap-2">
          {week.map((d) => (
            <div key={d.date}>
              <p className="mb-2 text-center text-sm">{formatInLahore(`${d.date}T12:00:00+05:00`, { weekday: "short", day: "numeric" })}</p>
              <ul className="space-y-1">
                {d.slots.map((s) => (
                  <li key={s.start} className={cn("tabular rounded-md px-2 py-1 text-center text-xs", s.available ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")}
                    title={s.available ? "Open" : "Booked"}>
                    {formatInLahore(s.start, { hour: "numeric" })}
                    <span className="sr-only">{s.available ? " open" : " booked"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-muted ring-1 ring-hairline" />Open</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" />Booked or requested</span>
        </p>
      </section>
      <ViewingList rows={await viewingRows(viewings, "host")} perspective="host" />
    </>
  );
}
