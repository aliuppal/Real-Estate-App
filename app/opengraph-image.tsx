import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Site-wide link preview in the Cohere style: white canvas, one large line, a deep-green band. */
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", padding: 72, justifyContent: "space-between" }}>
        <div style={{ fontSize: 40, letterSpacing: -1.5, color: "#17171c" }}>nestly</div>
        <div style={{ fontSize: 92, lineHeight: 1, letterSpacing: -3, color: "#17171c", maxWidth: 980 }}>Find the home that fits your life.</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#003c33", color: "#ffffff", borderRadius: 22, padding: "28px 36px", fontSize: 30 }}>
          <span>Rent · Buy · Sell · Verified agents</span>
          <span style={{ opacity: 0.7 }}>Lahore</span>
        </div>
      </div>
    ),
    size,
  );
}
