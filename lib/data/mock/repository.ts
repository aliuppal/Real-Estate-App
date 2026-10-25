import "server-only";
import type { Repository } from "../repository";
import { passwordResets, users } from "./repos/users";
import { agencies, agents, neighbourhoods, reviews, verification } from "./repos/directory";
import { listings, stats } from "./repos/listings";
import { collections, offers, reports, savedSearches, viewings } from "./repos/engagement";
import { conversations, notifications } from "./repos/messaging";
import { leads } from "./repos/crm";

/** In-memory implementation over the seeded dataset (see ./store.ts). */
export const mockRepository: Repository = {
  kind: "mock",
  users,
  passwordResets,
  neighbourhoods,
  listings,
  agents,
  agencies,
  verification,
  reviews,
  savedSearches,
  collections,
  conversations,
  viewings,
  leads,
  offers,
  notifications,
  reports,
  stats,
};
