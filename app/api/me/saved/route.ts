import { NextResponse } from "next/server";
import { repo } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/session";

export type SavedState = { canSave: boolean; signedIn: boolean; listingIds: string[]; collections: { id: string; name: string; listingIds: string[] }[] };

/** What the heart buttons need: which listings the seeker has saved, and in which collections. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "seeker") {
    return NextResponse.json<SavedState>({ canSave: false, signedIn: !!user, listingIds: [], collections: [] });
  }
  const collections = await repo.collections.forUser(user.id);
  return NextResponse.json<SavedState>({
    canSave: true,
    signedIn: true,
    listingIds: [...new Set(collections.flatMap((c) => c.listingIds))],
    collections: collections.map((c) => ({ id: c.id, name: c.name, listingIds: c.listingIds })),
  });
}
