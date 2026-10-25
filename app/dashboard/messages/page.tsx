import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { Inbox } from "@/components/features/messages/inbox";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requireUser("/dashboard/messages");
  return (
    <>
      <DashboardHeader eyebrow="Inbox" title="Messages" description="Conversations about listings, viewings and offers. New messages appear automatically." />
      <Suspense>
        <Inbox initial={[]} />
      </Suspense>
    </>
  );
}
