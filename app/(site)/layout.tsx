import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { getCurrentUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unread = user ? await repo.notifications.unreadCount(user.id) : 0;

  return (
    <>
      <SiteHeader
        user={user && { name: user.name, email: user.email, avatar: user.avatar, role: user.role }}
        unreadNotifications={unread}
      />
      {/* pt-16 clears the fixed header; the home hero pulls itself back up underneath it. */}
      <main id="main" className="pb-tabbar pt-16 md:pb-0">{children}</main>
      <SiteFooter />
      <MobileTabBar role={user?.role ?? null} />
    </>
  );
}
