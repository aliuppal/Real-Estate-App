import type {
  Agency, Agent, Collection, Conversation, ID, Lead, Listing, Message, Neighbourhood, Notification,
  Offer, Page, PasswordResetToken, PublicUser, Report, Review, Role, SavedSearch, SearchFilters, User, Viewing,
} from "./types";

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string | null;
  role: Role;
  avatar?: string | null;
  agencyId?: ID | null;
}

export interface NewAgency {
  name: string;
  email: string;
  phone: string;
}

export interface PlatformStats {
  users: number;
  activeListings: number;
  agents: number;
  agencies: number;
  pendingVerifications: number;
  openReports: number;
}

/**
 * The data-access contract. `lib/data/mock` and `lib/data/db` both implement it;
 * `lib/data/index.ts` picks one at runtime. Callers never import an implementation directly.
 */
export interface Repository {
  readonly kind: "mock" | "db";

  users: {
    findById(id: ID): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(input: NewUser): Promise<User>;
    setPassword(id: ID, passwordHash: string): Promise<void>;
    list(): Promise<PublicUser[]>;
  };

  passwordResets: {
    create(token: PasswordResetToken): Promise<void>;
    /** Returns the token and deletes it, or null if missing or expired. */
    consume(token: string): Promise<PasswordResetToken | null>;
  };

  neighbourhoods: {
    list(): Promise<Neighbourhood[]>;
    findBySlug(slug: string): Promise<Neighbourhood | null>;
    /** Active listing counts keyed by neighbourhood id. */
    listingCounts(): Promise<Record<ID, number>>;
  };

  listings: {
    search(filters: SearchFilters, page?: number, pageSize?: number): Promise<Page<Listing>>;
    findById(id: ID): Promise<Listing | null>;
    findBySlug(slug: string): Promise<Listing | null>;
    findManyByIds(ids: ID[]): Promise<Listing[]>;
    featured(limit: number): Promise<Listing[]>;
    newSince(days: number, limit: number): Promise<Listing[]>;
    byAgent(agentId: ID): Promise<Listing[]>;
    byOwner(ownerId: ID): Promise<Listing[]>;
    byAgency(agencyId: ID): Promise<Listing[]>;
    similar(listing: Listing, limit: number): Promise<Listing[]>;
  };

  agents: {
    list(): Promise<Agent[]>;
    findById(id: ID): Promise<Agent | null>;
    findBySlug(slug: string): Promise<Agent | null>;
    byAgency(agencyId: ID): Promise<Agent[]>;
  };

  agencies: {
    /** New agencies start unverified and appear in the admin verification queue. */
    create(input: NewAgency): Promise<Agency>;
    list(): Promise<Agency[]>;
    findById(id: ID): Promise<Agency | null>;
    findBySlug(slug: string): Promise<Agency | null>;
  };

  reviews: {
    forTarget(targetType: Review["targetType"], targetId: ID): Promise<Review[]>;
  };

  savedSearches: { forUser(userId: ID): Promise<SavedSearch[]> };
  collections: { forUser(userId: ID): Promise<Collection[]> };

  conversations: {
    forUser(userId: ID): Promise<Conversation[]>;
    messages(conversationId: ID): Promise<Message[]>;
    unreadCount(userId: ID): Promise<number>;
  };

  viewings: {
    forSeeker(userId: ID): Promise<Viewing[]>;
    forAgent(agentId: ID): Promise<Viewing[]>;
  };

  leads: {
    forAgent(agentId: ID): Promise<Lead[]>;
    forAgency(agencyId: ID): Promise<Lead[]>;
  };

  offers: {
    forSeeker(userId: ID): Promise<Offer[]>;
    forListing(listingId: ID): Promise<Offer[]>;
  };

  notifications: {
    forUser(userId: ID): Promise<Notification[]>;
    unreadCount(userId: ID): Promise<number>;
  };

  reports: { list(): Promise<Report[]> };

  stats: { platform(): Promise<PlatformStats> };
}
