import { buildSeed, type Dataset } from "./seed";

/**
 * One in-memory dataset per server process. Kept on `globalThis` so Next.js dev hot reloads
 * don't wipe signups and edits. Everything resets when the server restarts.
 */
const globalForStore = globalThis as unknown as { __nestlyStore?: Dataset };

export function store(): Dataset {
  globalForStore.__nestlyStore ??= buildSeed();
  return globalForStore.__nestlyStore;
}

let counter = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`;

export const now = () => new Date().toISOString();

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** First slug not already taken: "name", "name-2", "name-3"… */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  let slug = slugify(base) || "item";
  for (let n = 2; used.has(slug); n++) slug = `${slugify(base)}-${n}`;
  return slug;
}

export const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

/** Shallow-merges a patch into the record with this id, in place. Returns the record or null. */
export function patchById<T extends { id: string }>(items: T[], id: string, patch: NoInfer<Partial<T>>): T | null {
  const item = items.find((i) => i.id === id);
  if (!item) return null;
  Object.assign(item, patch);
  return item;
}
