"use client";

/** Last-resort boundary when the root layout itself fails, so it can't rely on app styles. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#17171c", display: "grid", placeItems: "center", minHeight: "100dvh" }}>
        <main role="alert" style={{ maxWidth: 480, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 40, fontWeight: 400, letterSpacing: "-0.02em", margin: 0 }}>Nestly is having trouble.</h1>
          <p style={{ color: "#616161", marginTop: 16 }}>Please try again in a moment.</p>
          <button onClick={reset} style={{ marginTop: 24, padding: "12px 24px", borderRadius: 999, border: 0, background: "#17171c", color: "#fff", fontSize: 15, cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
