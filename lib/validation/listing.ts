import { z } from "zod";
import { AMENITIES, PROPERTY_TYPES, PURPOSES } from "@/lib/data/types";

/** Image URLs are either our own uploads or Unsplash (the seed's source). */
const imageUrl = z.string().refine((u) => u.startsWith("/uploads/") || u.startsWith("https://images.unsplash.com/"), "Unsupported image source");

/** Rough bounding box around Lahore, so a mis-dropped pin can't land in another city. */
const LAHORE = { minLat: 31.2, maxLat: 31.75, minLng: 73.95, maxLng: 74.6 };

export const listingInputSchema = z
  .object({
    purpose: z.enum(PURPOSES),
    type: z.enum(PROPERTY_TYPES),
    title: z.string().trim().min(10, "Use at least 10 characters").max(100),
    description: z.string().trim().min(30, "Describe the property in at least 30 characters").max(4000),
    price: z.number().int().positive("Enter a price"),
    areaSqft: z.number().int().min(100, "Enter the area").max(500_000),
    plotSqft: z.number().int().positive().max(500_000).nullable(),
    beds: z.number().int().min(0).max(20),
    baths: z.number().int().min(0).max(20),
    furnished: z.boolean(),
    petsAllowed: z.boolean(),
    parking: z.number().int().min(0).max(50),
    amenities: z.array(z.enum(AMENITIES)).max(AMENITIES.length),
    images: z.array(imageUrl).min(1, "Add at least one photo").max(30),
    videoUrl: z.url().nullable(),
    address: z.string().trim().min(5, "Enter the address").max(160),
    neighbourhoodId: z.string().min(1, "Choose a neighbourhood"),
    location: z.object({
      lat: z.number().min(LAHORE.minLat).max(LAHORE.maxLat),
      lng: z.number().min(LAHORE.minLng).max(LAHORE.maxLng),
    }, "Drop a pin on the map"),
    yearBuilt: z.number().int().min(1900).max(new Date().getFullYear() + 2).nullable(),
    depositMonths: z.number().int().min(0).max(12).nullable(),
    advanceMonths: z.number().int().min(0).max(12).nullable(),
    /** Agency admins list on behalf of one of their agents. */
    agentId: z.string().nullable(),
  })
  .refine((v) => v.type === "plot" || v.type === "commercial" || v.beds > 0, { message: "Homes need at least one bedroom", path: ["beds"] });

export type ListingInput = z.infer<typeof listingInputSchema>;

export const enquirySchema = z.object({
  listingId: z.string().min(1),
  body: z.string().trim().min(2, "Write a message").max(2000),
});

export const viewingRequestSchema = z.object({
  listingId: z.string().min(1),
  start: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(500).nullable(),
});

export const callbackSchema = z.object({
  listingId: z.string().min(1),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, "Enter a valid phone number"),
  when: z.enum(["morning", "afternoon", "evening"]),
});

export const offerSchema = z.object({
  listingId: z.string().min(1),
  amount: z.number().int().positive("Enter an amount"),
  message: z.string().trim().max(1000).nullable(),
});
