"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Shows why the user landed here after middleware bounced them from another role's area. */
export function DeniedToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (params.get("denied") !== "1") return;
    toast.error("That area belongs to a different account type, so we brought you to your dashboard.");
    router.replace(pathname);
  }, [params, pathname, router]);

  return null;
}
