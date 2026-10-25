import type {
  Agency, Agent, Collection, Conversation, ID, Lead, LeadNote, LeadStage, Listing, Message, Neighbourhood,
  Notification, Offer, OfferStatus, Page, PasswordResetToken, PublicUser, Report, Review, Role, SavedSearch,
  SearchFilters, User, VerificationStatus, Viewing, ViewingStatus,
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

/** Fields an author provides; ids, slugs, counters and timestamps are filled in by the repository. */
export type NewListing = Omit<
  Listing,
  "id" | "slug" | "views" | "saves" | "enquiries" | "priceHistory" | "createdAt" | "updatedAt" | "verified"
>;

export type ListingPatch = Partial<Omit<Listing, "id" | "createdAt">>;

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
 * Repositories do no authorisation: server actions check the caller's role first.
 */
export interface Repository {
  readonly kind: "mock" | "db";

  users: {
    findById(id: ID): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findManyByIds(ids: ID[]): Promise<PublicUser[]>;
    create(input: NewUser): Promise<User>;
    update(id: ID, patch: Partial<Pick<User, "name" | "phone" | "avatar" | "status" | "agentId" | "agencyId">>): Promise<User | null>;
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
    findById(id: ID): Promise<Neighbourhood | null>;
    /** Active listing counts keyed by neighbourhood id. */
    listingCounts(): Promise<Record<ID, number>>;
  };

  listings: {
    search(filters: SearchFilters, page?: number, pageSize?: number): Promise<Page<Listing>>;
    /** Every public listing matching the filters, unpaginated (map pins). */
    searchAll(filters: SearchFilters): Promise<Listing[]>;
    findById(id: ID): Promise<Listing | null>;
    findBySlug(slug: string): Promise<Listing | null>;
    findManyByIds(ids: ID[]): Promise<Listing[]>;
    featured(limit: number): Promise<Listing[]>;
    newSince(days: number, limit: number): Promise<Listing[]>;
    byAgent(agentId: ID): Promise<Listing[]>;
    byOwner(ownerId: ID): Promise<Listing[]>;
    byAgency(agencyId: ID): Promise<Listing[]>;
    similar(listing: Listing, limit: number): Promise<Listing[]>;
    /** Public listings of the same type and purpose, for price suggestions and comparisons. */
    comparables(input: Pick<Listing, "type" | "purpose" | "neighbourhoodId">): Promise<Listing[]>;
    all(): Promise<Listing[]>;
    create(input: NewListing): Promise<Listing>;
    /** A price change appends to the price history. */
    update(id: ID, patch: ListingPatch): Promise<Listing | null>;
    recordView(id: ID): Promise<void>;
    adjustCounter(id: ID, key: "saves" | "enquiries", delta: number): Promise<void>;
  };

  agents: {
    list(): Promise<Agent[]>;
    findById(id: ID): Promise<Agent | null>;
    findBySlug(slug: string): Promise<Agent | null>;
    byAgency(agencyId: ID): Promise<Agent[]>;
    /** Creates a pending agent profile for a newly registered agent user. */
    createForUser(user: Pick<User, "id" | "name" | "email" | "phone" | "avatar" | "agencyId">): Promise<Agent>;
    update(id: ID, patch: Partial<Omit<Agent, "id" | "userId">>): Promise<Agent | null>;
  };

  agencies: {
    /** New agencies start unverified and appear in the admin verification queue. */
    create(input: NewAgency): Promise<Agency>;
    list(): Promise<Agency[]>;
    findById(id: ID): Promise<Agency | null>;
    findBySlug(slug: string): Promise<Agency | null>;
    update(id: ID, patch: Partial<Omit<Agency, "id" | "slug">>): Promise<Agency | null>;
  };

  verification: {
    set(kind: "agent" | "agency", id: ID, status: VerificationStatus, reason?: string): Promise<void>;
  };

  reviews: {
    forTarget(targetType: Review["targetType"], targetId: ID): Promise<Review[]>;
  };

  savedSearches: {
    forUser(userId: ID): Promise<SavedSearch[]>;
    create(input: Pick<SavedSearch, "userId" | "name" | "filters" | "alertsEnabled">): Promise<SavedSearch>;
    update(id: ID, patch: Partial<Pick<SavedSearch, "name" | "alertsEnabled" | "lastCheckedAt">>): Promise<SavedSearch | null>;
    remove(id: ID): Promise<void>;
    /** Alert-enabled saved searches (from all users) that a listing matches. */
    matchingAlerts(listing: Listing): Promise<SavedSearch[]>;
  };

  collections: {
    forUser(userId: ID): Promise<Collection[]>;
    create(userId: ID, name: string): Promise<Collection>;
    rename(id: ID, name: string): Promise<void>;
    remove(id: ID): Promise<void>;
    setMembership(id: ID, listingId: ID, member: boolean): Promise<Collection | null>;
  };

  conversations: {
    findById(id: ID): Promise<Conversation | null>;
    forUser(userId: ID): Promise<Conversation[]>;
    /** Returns the existing thread between these people about this listing, or starts one. */
    findOrStart(listingId: ID | null, participantIds: ID[]): Promise<Conversation>;
    messages(conversationId: ID): Promise<Message[]>;
    send(conversationId: ID, senderId: ID, body: string): Promise<Message>;
    markRead(conversationId: ID, userId: ID): Promise<void>;
    unreadCount(userId: ID): Promise<number>;
  };

  viewings: {
    forSeeker(userId: ID): Promise<Viewing[]>;
    forAgent(agentId: ID): Promise<Viewing[]>;
    forListings(listingIds: ID[]): Promise<Viewing[]>;
    findById(id: ID): Promise<Viewing | null>;
    create(input: Pick<Viewing, "listingId" | "seekerId" | "agentId" | "start" | "end" | "note">): Promise<Viewing>;
    setStatus(id: ID, status: ViewingStatus): Promise<Viewing | null>;
  };

  leads: {
    forAgent(agentId: ID): Promise<Lead[]>;
    forAgency(agencyId: ID): Promise<Lead[]>;
    findById(id: ID): Promise<Lead | null>;
    create(input: Pick<Lead, "agentId" | "seekerId" | "listingId" | "name" | "email" | "phone" | "source" | "budget">): Promise<Lead>;
    update(id: ID, patch: Partial<Pick<Lead, "stage" | "agentId">>): Promise<Lead | null>;
    addNote(id: ID, body: string): Promise<LeadNote | null>;
  };

  offers: {
    forSeeker(userId: ID): Promise<Offer[]>;
    forListings(listingIds: ID[]): Promise<Offer[]>;
    findById(id: ID): Promise<Offer | null>;
    create(input: Pick<Offer, "listingId" | "seekerId" | "kind" | "amount" | "message">): Promise<Offer>;
    setStatus(id: ID, status: OfferStatus): Promise<Offer | null>;
  };

  notifications: {
    forUser(userId: ID): Promise<Notification[]>;
    unreadCount(userId: ID): Promise<number>;
    create(input: Pick<Notification, "userId" | "type" | "title" | "body" | "href">): Promise<Notification>;
    markRead(userId: ID, ids: ID[] | "all"): Promise<void>;
  };

  reports: {
    list(): Promise<Report[]>;
    create(input: Pick<Report, "listingId" | "reporterId" | "reason">): Promise<Report>;
    setStatus(id: ID, status: Report["status"]): Promise<void>;
  };

  stats: { platform(): Promise<PlatformStats> };
}

export type { LeadStage };
