import "server-only";
import type { Repository } from "../repository";

/**
 * Drizzle + Neon implementation. Stubbed until Phase 3: the schema, migrations and queries land
 * together once the database is connected. Until then, leave DATABASE_URL empty to use mock data.
 */
const notYet = (): never => {
  throw new Error(
    "The Neon repository is not implemented yet (Phase 3). Unset DATABASE_URL to run on mock data.",
  );
};

const stubGroup = <T extends object>() =>
  new Proxy({} as T, { get: () => notYet });

/** Phase 3 reads DATABASE_URL here to create the Neon client. */
export function createDbRepository(): Repository {
  return {
    kind: "db",
    users: stubGroup(),
    passwordResets: stubGroup(),
    neighbourhoods: stubGroup(),
    listings: stubGroup(),
    agents: stubGroup(),
    agencies: stubGroup(),
    reviews: stubGroup(),
    savedSearches: stubGroup(),
    collections: stubGroup(),
    conversations: stubGroup(),
    viewings: stubGroup(),
    leads: stubGroup(),
    offers: stubGroup(),
    notifications: stubGroup(),
    reports: stubGroup(),
    stats: stubGroup(),
  };
}
