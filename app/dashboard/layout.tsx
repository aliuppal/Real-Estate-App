import { Suspense } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DeniedToast } from "@/components/dashboard/denied-toast";
import { Logo } from "@/components/layout/logo";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { UserMenu } from "@/components/layout/user-menu";
import { requireUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const [unreadMessages, unreadNotifications] = await Promise.all([
    repo.conversations.unreadCount(user.id),
    repo.notifications.unreadCount(user.id),
  ]);
  const navUser = { name: user.name, email: user.email, avatar: user.avatar, role: user.role };

  return (
    <div className="flex min-h-dvh">
      <DashboardSidebar user={navUser} unreadMessages={unreadMessages} unreadNotifications={unreadNotifications} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <Logo />
          <UserMenu user={navUser} />
        </header>
        <main id="main" className="pb-tabbar mx-auto max-w-6xl px-4 py-10 sm:px-8 lg:py-14 lg:pb-14">
          {children}
        </main>
      </div>
      <MobileTabBar role={user.role} />
      <Suspense>
        <DeniedToast />
      </Suspense>
    </div>
  );
}
