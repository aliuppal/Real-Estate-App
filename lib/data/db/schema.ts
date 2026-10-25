import { bigint, boolean, doublePrecision, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type {
  Agent, Amenity, LeadNote, NeighbourhoodScores, PricePoint, PropertyType, Purpose, SearchFilters,
} from "../types";

/**
 * Postgres schema. Property names match the domain types in ../types.ts so mapping stays thin:
 * timestamps come back as Date (mappers turn them into ISO strings) and listing location is split
 * into lat/lng columns. Arrays use text[]; nested values use jsonb.
 */

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const money = (name: string) => bigint(name, { mode: "number" });

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull(),
  avatar: text("avatar"),
  phone: text("phone"),
  agentId: text("agent_id"),
  agencyId: text("agency_id"),
  status: text("status").notNull().default("active"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: ts("expires_at").notNull(),
});

export const neighbourhoods = pgTable("neighbourhoods", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  scores: jsonb("scores").$type<NeighbourhoodScores>().notNull(),
  avgSalePerSqft: integer("avg_sale_per_sqft").notNull(),
  avgRentPerSqft: integer("avg_rent_per_sqft").notNull(),
});

export const agencies = pgTable("agencies", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logo: text("logo").notNull().default(""),
  cover: text("cover").notNull().default(""),
  description: text("description").notNull().default(""),
  foundedYear: integer("founded_year").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  serviceAreas: text("service_areas").array().notNull().default([]),
  verification: text("verification").notNull().default("pending"),
  rating: doublePrecision("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  userId: text("user_id").notNull(),
  agencyId: text("agency_id"),
  name: text("name").notNull(),
  photo: text("photo").notNull().default(""),
  title: text("title").notNull(),
  bio: text("bio").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull(),
  specialties: text("specialties").array().$type<PropertyType[]>().notNull(),
  purposes: text("purposes").array().$type<Purpose[]>().notNull(),
  serviceAreas: text("service_areas").array().notNull(),
  languages: text("languages").array().notNull(),
  rating: doublePrecision("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  dealsClosed: integer("deals_closed").notNull().default(0),
  dealsByPurpose: jsonb("deals_by_purpose").$type<Agent["dealsByPurpose"]>().notNull(),
  avgResponseMins: integer("avg_response_mins").notNull(),
  yearsExperience: integer("years_experience").notNull(),
  priceBands: jsonb("price_bands").$type<Agent["priceBands"]>().notNull(),
  verification: text("verification").notNull().default("pending"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("agents_agency_idx").on(t.agencyId)]);

export const listings = pgTable("listings", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  purpose: text("purpose").$type<Purpose>().notNull(),
  type: text("type").$type<PropertyType>().notNull(),
  status: text("status").notNull(),
  price: money("price").notNull(),
  areaSqft: integer("area_sqft").notNull(),
  plotSqft: integer("plot_sqft"),
  beds: integer("beds").notNull(),
  baths: integer("baths").notNull(),
  furnished: boolean("furnished").notNull(),
  petsAllowed: boolean("pets_allowed").notNull(),
  parking: integer("parking").notNull(),
  amenities: text("amenities").array().$type<Amenity[]>().notNull(),
  images: text("images").array().notNull(),
  floorPlan: text("floor_plan"),
  videoUrl: text("video_url"),
  address: text("address").notNull(),
  neighbourhoodId: text("neighbourhood_id").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  yearBuilt: integer("year_built"),
  listedBy: text("listed_by").$type<"owner" | "agent">().notNull(),
  ownerId: text("owner_id"),
  agentId: text("agent_id"),
  agencyId: text("agency_id"),
  verified: boolean("verified").notNull().default(false),
  views: integer("views").notNull().default(0),
  saves: integer("saves").notNull().default(0),
  enquiries: integer("enquiries").notNull().default(0),
  priceHistory: jsonb("price_history").$type<PricePoint[]>().notNull(),
  depositMonths: integer("deposit_months"),
  advanceMonths: integer("advance_months"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [
  index("listings_status_idx").on(t.status),
  index("listings_neighbourhood_idx").on(t.neighbourhoodId),
  index("listings_agent_idx").on(t.agentId),
  index("listings_owner_idx").on(t.ownerId),
  index("listings_agency_idx").on(t.agencyId),
]);

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  targetType: text("target_type").$type<"agent" | "agency">().notNull(),
  targetId: text("target_id").notNull(),
  authorId: text("author_id"),
  authorName: text("author_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("reviews_target_idx").on(t.targetType, t.targetId)]);

export const savedSearches = pgTable("saved_searches", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  filters: jsonb("filters").$type<SearchFilters>().notNull(),
  alertsEnabled: boolean("alerts_enabled").notNull().default(true),
  lastCheckedAt: ts("last_checked_at").notNull().defaultNow(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("saved_searches_user_idx").on(t.userId)]);

export const collections = pgTable("collections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  listingIds: text("listing_ids").array().notNull().default([]),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("collections_user_idx").on(t.userId)]);

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  listingId: text("listing_id"),
  participantIds: text("participant_ids").array().notNull(),
  lastMessageAt: ts("last_message_at").notNull().defaultNow(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  senderId: text("sender_id").notNull(),
  body: text("body").notNull(),
  readBy: text("read_by").array().notNull().default([]),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("messages_conversation_idx").on(t.conversationId)]);

export const viewings = pgTable("viewings", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  seekerId: text("seeker_id").notNull(),
  agentId: text("agent_id"),
  start: ts("start").notNull(),
  end: ts("end").notNull(),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("viewings_agent_idx").on(t.agentId), index("viewings_seeker_idx").on(t.seekerId), index("viewings_listing_idx").on(t.listingId)]);

export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  seekerId: text("seeker_id"),
  listingId: text("listing_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  stage: text("stage").notNull(),
  source: text("source").notNull(),
  budget: money("budget"),
  notes: jsonb("notes").$type<LeadNote[]>().notNull().default([]),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [index("leads_agent_idx").on(t.agentId)]);

export const offers = pgTable("offers", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  seekerId: text("seeker_id").notNull(),
  kind: text("kind").$type<"offer" | "application">().notNull(),
  amount: money("amount").notNull(),
  message: text("message"),
  status: text("status").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [index("offers_listing_idx").on(t.listingId), index("offers_seeker_idx").on(t.seekerId)]);

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  href: text("href"),
  read: boolean("read").notNull().default(false),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("notifications_user_idx").on(t.userId)]);

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  reporterId: text("reporter_id"),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: ts("created_at").notNull().defaultNow(),
});
