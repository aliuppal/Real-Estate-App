import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ImageStorage } from "./index";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/** Writes to /public/uploads. Fine for development; serverless hosts need a persistent driver. */
export const localStorageDriver: ImageStorage = {
  async save(file) {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    // Name comes from a UUID and a whitelisted extension, never from the client's filename.
    const name = `${randomUUID()}.${EXT[file.type] ?? "bin"}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    return { url: `/uploads/${name}` };
  },
};
