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
