import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { LISTER_ROLES } from "@/lib/auth/roles";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, getStorage } from "@/lib/storage";

/** Listing photo upload. Listers only; images up to 8 MB. Returns the stored URL. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !LISTER_ROLES.includes(user.role)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  // Serverless filesystems are read-only; local storage only works on a long-running server.
  if (process.env.VERCEL && (process.env.STORAGE_DRIVER ?? "local") === "local") {
    return NextResponse.json({ error: "Photo uploads need a storage provider on this deployment. Use the sample photos for now." }, { status: 501 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP or AVIF image" }, { status: 415 });
  }
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Images must be 8 MB or smaller" }, { status: 413 });

  const { url } = await getStorage().save(file);
  return NextResponse.json({ url }, { status: 201 });
}
