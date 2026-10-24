import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AuthShowcase } from "@/components/features/auth/auth-showcase";

/** Split screen: form on the left, rotating photography and a resident story on the right (lg+). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <header className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </header>
        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          {children}
        </main>
      </div>
      <div className="sticky top-0 hidden h-dvh p-3 lg:block">
        <AuthShowcase />
      </div>
    </div>
  );
}
