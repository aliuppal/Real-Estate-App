"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveReport, setUserStatus, setVerification } from "@/app/actions/admin";
import type { PublicUser, Report } from "@/lib/data/types";
import { roleLabels } from "@/lib/labels";
import { formatRelativeDate } from "@/lib/format";
import { StatusPill } from "@/components/dashboard/stat-card";

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string, after?: () => void) => startTransition(async () => {
    const res = await fn();
    if (!res.ok) return void toast.error(res.error);
    toast.success(done);
    after?.();
    router.refresh();
  });
  return { pending, run };
}

export type QueueItem = { kind: "agent" | "agency"; id: string; name: string; detail: string; href: string; createdAt: string };

function QueueRow({ item }: { item: QueueItem }) {
  const { pending, run } = useAction();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <li className="p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="mono-label text-[0.6875rem] text-meta">{item.kind} · applied {formatRelativeDate(item.createdAt)}</p>
          <Link href={item.href} className="text-lg underline-offset-4 hover:underline">{item.name}</Link>
          <p className="text-sm text-muted-foreground">{item.detail}</p>
        </div>
        <Button size="sm" disabled={pending} onClick={() => run(() => setVerification(item.kind, item.id, "verified"), `${item.name} verified`)}>Approve</Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setRejecting((r) => !r)}>Reject</Button>
      </div>
      {rejecting && (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => setVerification(item.kind, item.id, "rejected", reason), "Rejected with reason", () => setRejecting(false)); }}>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason, e.g. licence number missing" aria-label="Rejection reason" required className="h-9" />
          <Button size="sm" variant="destructive" type="submit" disabled={pending}>Send</Button>
        </form>
      )}
    </li>
  );
}

export function VerificationQueue({ items }: { items: QueueItem[] }) {
  if (!items.length) return <p className="rounded-media border border-dashed border-hairline py-16 text-center text-muted-foreground">The queue is clear.</p>;
  return <ul className="divide-y divide-border overflow-hidden rounded-media border border-border bg-card">{items.map((i) => <QueueRow key={`${i.kind}-${i.id}`} item={i} />)}</ul>;
}

export type ReportRow = Report & { listingTitle: string; reporterName: string | null };

export function ReportList({ reports }: { reports: ReportRow[] }) {
  const { pending, run } = useAction();
  if (!reports.length) return <p className="rounded-media border border-dashed border-hairline py-16 text-center text-muted-foreground">No reports.</p>;
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-media border border-border bg-card">
      {reports.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-4 p-5">
          <div className="min-w-0 flex-1">
            <Link href={`/listings/${r.listingId}`} className="underline-offset-4 hover:underline">{r.listingTitle}</Link>
            <p className="text-sm">{r.reason}</p>
            <p className="text-xs text-muted-foreground">{r.reporterName ?? "Anonymous"} · {formatRelativeDate(r.createdAt)}</p>
          </div>
          <StatusPill status={r.status} />
          {r.status === "open" && (
            <>
              <Button size="sm" disabled={pending} onClick={() => run(() => resolveReport(r.id, "resolved"), "Marked resolved")}>Resolve</Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => resolveReport(r.id, "dismissed"), "Dismissed")}>Dismiss</Button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export function UserTable({ users }: { users: PublicUser[] }) {
  const { pending, run } = useAction();
  const [q, setQ] = useState("");
  const shown = users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or role" aria-label="Search users" className="h-10 max-w-sm" />
      <div className="overflow-x-auto rounded-media border border-border bg-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="px-5 py-3 font-normal">Name</th><th className="px-5 py-3 font-normal">Role</th><th className="px-5 py-3 font-normal">Joined</th><th className="px-5 py-3 font-normal">Status</th><th className="px-5 py-3" /></tr></thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3"><span className="block">{u.name}</span><span className="text-xs text-muted-foreground">{u.email}</span></td>
                <td className="px-5 py-3">{roleLabels[u.role]}</td>
                <td className="px-5 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}</td>
                <td className="px-5 py-3"><StatusPill status={u.status === "active" ? "active" : "rejected"} /></td>
                <td className="px-5 py-3 text-right">
                  {u.role !== "admin" && (
                    <Button size="sm" variant={u.status === "active" ? "ghost" : "outline"} disabled={pending}
                      onClick={() => run(() => setUserStatus(u.id, u.status === "active" ? "suspended" : "active"), u.status === "active" ? `${u.name} suspended` : `${u.name} reactivated`)}>
                      {u.status === "active" ? "Suspend" : "Reactivate"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
