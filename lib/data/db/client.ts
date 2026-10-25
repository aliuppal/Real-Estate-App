import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __nestlyDb?: Db };

/** One Drizzle client per process over Neon's HTTP driver (works in serverless and edge runtimes). */
export function db(): Db {
  if (!globalForDb.__nestlyDb) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) throw new Error("DATABASE_URL is not set");
    globalForDb.__nestlyDb = drizzle(neon(url), { schema });
  }
  return globalForDb.__nestlyDb;
}

export { schema };
