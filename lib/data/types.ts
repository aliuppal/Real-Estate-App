/**
 * Shared domain types. Both the mock and the Drizzle/Neon repositories speak these.
 * Dates are ISO-8601 strings, prices are integers in the base currency (see config/locale.ts),
 * areas are integer square feet.
 */

export type ID = string;
export type ISODate = string;

export const ROLES = ["seeker", "owner", "agent", "agency_admin", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PURPOSES = ["rent", "sale"] as const;
export type Purpose = (typeof PURPOSES)[number];

export const PROPERTY_TYPES = ["apartment", "house", "villa", "plot", "commercial"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const AMENITIES = [
  "garden", "pool", "gym", "security", "backup_power", "lift", "servant_quarter",
  "basement", "rooftop", "solar", "gas", "near_school", "near_mosque", "near_park",
  "near_hospital", "corner", "park_facing", "air_conditioning", "balcony", "study",
] as const;
export type Amenity = (typeof AMENITIES)[number];

export type ListingStatus = "draft" | "active" | "under_offer" | "sold" | "rented" | "archived";
export type ListedBy = "owner" | "agent";
export type GeoPoint = { lat: number; lng: number };

export interface User {
  id: ID;
  name: string;
  email: string;
  /** bcrypt hash; null for OAuth-only accounts. Never send to the client. */
  passwordHash: string | null;
  role: Role;
  avatar: string | null;
  phone: string | null;
  agentId: ID | null;
  agencyId: ID | null;
  status: "active" | "suspended";
  createdAt: ISODate;
}
export type PublicUser = Omit<User, "passwordHash">;

/** Strips the password hash before a user leaves the data layer. */
export function toPublicUser(user: User): PublicUser {
  const copy: Partial<User> = { ...user };
  delete copy.passwordHash;
  return copy as PublicUser;
}

export interface NeighbourhoodScores {
  walkability: number;
  schools: number;
  safety: number;
  transport: number;
}

export interface Neighbourhood {
  id: ID;
  slug: string;
  name: string;
  city: string;
  center: GeoPoint;
  description: string;
  image: string;
  scores: NeighbourhoodScores;
  /** Reference price per sq ft used for comparisons and suggested pricing. */
  avgSalePerSqft: number;
  avgRentPerSqft: number;
}

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface Agency {
  id: ID;
  slug: string;
  name: string;
  logo: string;
  cover: string;
  description: string;
  foundedYear: number;
  phone: string;
  email: string;
  website: string | null;
  serviceAreas: ID[];
  verification: VerificationStatus;
  rating: number;
  reviewCount: number;
  createdAt: ISODate;
}

export interface Agent {
  id: ID;
  slug: string;
  userId: ID;
  agencyId: ID | null;
  name: string;
  photo: string;
  title: string;
  bio: string;
  phone: string;
  email: string;
  specialties: PropertyType[];
  purposes: Purpose[];
  serviceAreas: ID[];
  languages: string[];
  rating: number;
  reviewCount: number;
  dealsClosed: number;
  /** Deals per purpose, used by the matching engine. */
  dealsByPurpose: Record<Purpose, number>;
  avgResponseMins: number;
  yearsExperience: number;
  /** Typical price band of the deals this agent handles, per purpose (rent is monthly). */
  priceBands: Partial<Record<Purpose, { min: number; max: number }>>;
  verification: VerificationStatus;
  createdAt: ISODate;
}

export interface PricePoint {
  date: ISODate;
  price: number;
}

export interface Listing {
  id: ID;
  slug: string;
  title: string;
  description: string;
  purpose: Purpose;
  type: PropertyType;
  status: ListingStatus;
  /** Sale price, or monthly rent. */
  price: number;
  /** Covered area (built space); for plots, the land area. */
  areaSqft: number;
  /** Land area for houses, villas and plots, e.g. "10 Marla". Null for apartments and commercial. */
  plotSqft: number | null;
  beds: number;
  baths: number;
  furnished: boolean;
  petsAllowed: boolean;
  parking: number;
  amenities: Amenity[];
  /** First image is the cover. */
  images: string[];
  floorPlan: string | null;
  videoUrl: string | null;
  address: string;
  neighbourhoodId: ID;
  location: GeoPoint;
  yearBuilt: number | null;
  listedBy: ListedBy;
  ownerId: ID | null;
  agentId: ID | null;
  agencyId: ID | null;
  verified: boolean;
  views: number;
  saves: number;
  enquiries: number;
  priceHistory: PricePoint[];
  /** Rent only: months of deposit and advance. */
  depositMonths: number | null;
  advanceMonths: number | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Review {
  id: ID;
  targetType: "agent" | "agency";
  targetId: ID;
  authorId: ID | null;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: ISODate;
}

export type SortKey = "newest" | "price_asc" | "price_desc" | "most_viewed" | "price_per_area";

export interface SearchFilters {
  purpose?: Purpose;
  types?: PropertyType[];
  neighbourhoodIds?: ID[];
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  minAreaSqft?: number;
  maxAreaSqft?: number;
  furnished?: boolean;
  petsAllowed?: boolean;
  parking?: boolean;
  amenities?: Amenity[];
  listedBy?: ListedBy;
  verifiedOnly?: boolean;
  /** Only listings created within the last N days. */
  listedWithinDays?: number;
  /** Polygon drawn on the map, as [lat, lng] vertices. */
  polygon?: [number, number][];
  sort?: SortKey;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SavedSearch {
  id: ID;
  userId: ID;
  name: string;
  filters: SearchFilters;
  alertsEnabled: boolean;
  lastCheckedAt: ISODate;
  createdAt: ISODate;
}

export interface Collection {
  id: ID;
  userId: ID;
  name: string;
  listingIds: ID[];
  createdAt: ISODate;
}

export interface Conversation {
  id: ID;
  listingId: ID | null;
  participantIds: ID[];
  lastMessageAt: ISODate;
  createdAt: ISODate;
}

export interface Message {
  id: ID;
  conversationId: ID;
  senderId: ID;
  body: string;
  readBy: ID[];
  createdAt: ISODate;
}

export type ViewingStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface Viewing {
  id: ID;
  listingId: ID;
  seekerId: ID;
  agentId: ID | null;
  start: ISODate;
  end: ISODate;
  status: ViewingStatus;
  note: string | null;
  createdAt: ISODate;
}

export const LEAD_STAGES = ["new", "contacted", "viewing", "offer", "closed", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export interface LeadNote {
  id: ID;
  body: string;
  createdAt: ISODate;
}

export interface Lead {
  id: ID;
  agentId: ID;
  seekerId: ID | null;
  listingId: ID | null;
  name: string;
  email: string;
  phone: string | null;
  stage: LeadStage;
  source: "listing_enquiry" | "match_quiz" | "call_back" | "handover" | "referral";
  budget: number | null;
  notes: LeadNote[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type OfferStatus = "submitted" | "reviewing" | "accepted" | "rejected" | "withdrawn";

export interface Offer {
  id: ID;
  listingId: ID;
  seekerId: ID;
  kind: "offer" | "application";
  amount: number;
  message: string | null;
  status: OfferStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type NotificationType =
  | "saved_search_match" | "message" | "viewing" | "offer" | "lead" | "verification" | "system";

export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: ISODate;
}

export interface Report {
  id: ID;
  listingId: ID;
  reporterId: ID | null;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: ISODate;
}

export interface PasswordResetToken {
  token: string;
  userId: ID;
  expiresAt: ISODate;
}
