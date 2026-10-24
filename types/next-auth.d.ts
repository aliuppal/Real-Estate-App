import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/data/types";

declare module "next-auth" {
  interface User {
    role?: Role;
    agentId?: string | null;
    agencyId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      agentId: string | null;
      agencyId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    agentId?: string | null;
    agencyId?: string | null;
  }
}
