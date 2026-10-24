import { describe, expect, it } from "vitest";
import { canAccess, isProtected } from "@/lib/auth/roles";

describe("role-based route rules", () => {
  it("leaves public pages open", () => {
    expect(isProtected("/")).toBe(false);
    expect(isProtected("/search")).toBe(false);
    expect(canAccess("/listings/l-1", undefined)).toBe(true);
  });

  it("requires sign-in for any dashboard route", () => {
    expect(canAccess("/dashboard/messages", undefined)).toBe(false);
    expect(canAccess("/dashboard/messages", "seeker")).toBe(true);
  });

  it("keeps each role inside its own area", () => {
    expect(canAccess("/dashboard/seeker/saved", "seeker")).toBe(true);
    expect(canAccess("/dashboard/seeker/saved", "owner")).toBe(false);
    expect(canAccess("/dashboard/admin", "agency_admin")).toBe(false);
    expect(canAccess("/dashboard/admin/users", "admin")).toBe(true);
  });

  it("matches whole path segments, so /dashboard/agent doesn't grant /dashboard/agency", () => {
    expect(canAccess("/dashboard/agency/team", "agent")).toBe(false);
    expect(canAccess("/dashboard/agent/leads", "agency_admin")).toBe(false);
  });

  it("lets every listing role into the shared listing wizard, but not seekers", () => {
    for (const role of ["owner", "agent", "agency_admin"] as const) expect(canAccess("/dashboard/listings/new", role)).toBe(true);
    expect(canAccess("/dashboard/listings/new", "seeker")).toBe(false);
  });
});
