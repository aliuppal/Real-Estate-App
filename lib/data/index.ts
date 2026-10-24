import "server-only";
import type { Repository } from "./repository";
import { mockRepository } from "./mock/repository";
import { createDbRepository } from "./db/repository";

/** DATABASE_URL set → Neon (Drizzle). Otherwise → in-memory mock data. */
function pickRepository(): Repository {
  return process.env.DATABASE_URL?.trim() ? createDbRepository() : mockRepository;
}

export const repo: Repository = pickRepository();

export type { Repository } from "./repository";
export * from "./types";
