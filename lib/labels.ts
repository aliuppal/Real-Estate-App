import type { Amenity, LeadStage, PropertyType, Purpose, Role } from "@/lib/data/types";

export const purposeLabels: Record<Purpose, string> = { rent: "For rent", sale: "For sale" };

export const typeLabels: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "House",
  villa: "Villa",
  plot: "Plot",
  commercial: "Commercial",
};

export const roleLabels: Record<Role, string> = {
  seeker: "Seeker",
  owner: "Owner / Seller",
  agent: "Agent",
  agency_admin: "Agency Admin",
  admin: "Platform Admin",
};

export const amenityLabels: Record<Amenity, string> = {
  garden: "Garden",
  pool: "Swimming pool",
  gym: "Gym",
  security: "24/7 security",
  backup_power: "Backup power",
  lift: "Lift",
  servant_quarter: "Servant quarter",
  basement: "Basement",
  rooftop: "Rooftop terrace",
  solar: "Solar panels",
  gas: "Gas connection",
  near_school: "Near a school",
  near_mosque: "Near a mosque",
  near_park: "Near a park",
  near_hospital: "Near a hospital",
  corner: "Corner plot",
  park_facing: "Park facing",
  air_conditioning: "Air conditioning",
  balcony: "Balcony",
  study: "Study",
};

export const leadStageLabels: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  viewing: "Viewing",
  offer: "Offer",
  closed: "Closed",
  lost: "Lost",
};
