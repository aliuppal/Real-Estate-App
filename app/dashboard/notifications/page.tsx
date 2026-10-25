import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { NotificationList } from "@/components/features/messages/notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/dashboard/notifications");
  const [items, unread, unreadMessages] = await Promise.all([
    repo.notifications.forUser(user.id), repo.notifications.unreadCount(user.id), repo.conversations.unreadCount(user.id),
  ]);
  return (
    <>
      <DashboardHeader eyebrow="Inbox" title="Notifications" />
      <NotificationList initial={{ items: items.slice(0, 20), unread, unreadMessages }} />
    </>
  );
}
