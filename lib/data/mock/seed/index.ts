import type {
  Agency, Agent, Collection, Conversation, Lead, Listing, Message, Neighbourhood, Notification,
  Offer, PasswordResetToken, Report, Review, SavedSearch, User, Viewing,
} from "../../types";
import { neighbourhoods } from "./neighbourhoods";
import { agencies } from "./agencies";
import { agents } from "./agents";
import { users } from "./users";
import { buildListings } from "./listings";
import { buildActivity, buildReviews } from "./activity";

export interface Dataset {
  users: User[];
  neighbourhoods: Neighbourhood[];
  agencies: Agency[];
  agents: Agent[];
  listings: Listing[];
  reviews: Review[];
  savedSearches: SavedSearch[];
  collections: Collection[];
  conversations: Conversation[];
  messages: Message[];
  viewings: Viewing[];
  leads: Lead[];
  offers: Offer[];
  notifications: Notification[];
  reports: Report[];
  resetTokens: PasswordResetToken[];
}

const average = (xs: number[]) =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0;

/** Builds a fresh, deterministic copy of all seed data. Used by the mock store and the DB seed script. */
export function buildSeed(): Dataset {
  const nbs = structuredClone(neighbourhoods);
  const ags = structuredClone(agencies);
  const ats = structuredClone(agents);
  const listings = buildListings(nbs, ats);
  const reviews = buildReviews(ats, ags);

  for (const target of [...ats, ...ags]) {
    const mine = reviews.filter((r) => r.targetId === target.id).map((r) => r.rating);
    target.rating = average(mine);
    target.reviewCount = mine.length;
  }

  return {
    users: structuredClone(users),
    neighbourhoods: nbs,
    agencies: ags,
    agents: ats,
    listings,
    reviews,
    ...buildActivity(listings, ats),
    resetTokens: [],
  };
}
