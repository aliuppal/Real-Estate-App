import { ImageResponse } from "next/og";
import { repo } from "@/lib/data";
import { formatPrice, plotSizeLabel, formatArea } from "@/lib/format";
import { typeLabels } from "@/lib/labels";

export const alt = "Property on Nestly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Per-listing link preview: cover photo, title, price and key facts. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = (await repo.listings.findById(id)) ?? (await repo.listings.findBySlug(id));
  const visible = listing && (listing.status === "active" || listing.status === "under_offer");
  const nb = visible ? await repo.neighbourhoods.findById(listing.neighbourhoodId) : null;

  if (!visible) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", fontSize: 64, color: "#17171c" }}>nestly</div>,
      size,
    );
  }

  const facts = [
    listing.beds ? `${listing.beds} bed` : null,
    listing.baths ? `${listing.baths} bath` : null,
    listing.plotSqft ? plotSizeLabel(listing.plotSqft) : formatArea(listing.areaSqft, "sqft"),
  ].filter(Boolean).join("  ·  ");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#17171c" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listing.images[0].replace("w=1600", "w=1200")} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover", width: "100%", height: "100%" }} />
        {/* Satori needs backgroundImage (not the background shorthand) for gradients. */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex", backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.15) 100%)" }} />
        <div style={{ position: "absolute", top: 48, left: 56, fontSize: 34, color: "#ffffff", letterSpacing: -1 }}>nestly</div>
        <div style={{ position: "absolute", left: 56, right: 56, bottom: 52, display: "flex", flexDirection: "column", color: "#ffffff" }}>
          <div style={{ fontSize: 24, letterSpacing: 2, textTransform: "uppercase", opacity: 0.75 }}>
            {`${typeLabels[listing.type]} · ${listing.purpose === "rent" ? "For rent" : "For sale"} · ${nb?.name ?? ""}`}
          </div>
          <div style={{ fontSize: 60, lineHeight: 1.05, letterSpacing: -2, marginTop: 14 }}>{listing.title}</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 22 }}>
            <div style={{ fontSize: 52, letterSpacing: -1.5 }}>{formatPrice(listing.price, { compact: true, purpose: listing.purpose })}</div>
            <div style={{ fontSize: 28, opacity: 0.85 }}>{facts}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
