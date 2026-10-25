/**
 * Loads the demo dataset into the database in DATABASE_URL (from .env.local).
 * Destructive: it empties every Nestly table first. Run with `npm run db:seed`.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

async function main() {
  const { buildSeed } = await import("../lib/data/mock/seed");
  const { db, schema } = await import("../lib/data/db/client");
  const { into, listingIn } = await import("../lib/data/db/mappers");
  const d = buildSeed();
  const conn = db();

  const tables = [
    schema.users, schema.passwordResetTokens, schema.neighbourhoods, schema.agencies, schema.agents, schema.listings,
    schema.reviews, schema.savedSearches, schema.collections, schema.conversations, schema.messages, schema.viewings,
    schema.leads, schema.offers, schema.notifications, schema.reports,
  ];
  for (const t of tables) await conn.delete(t);

  const insert = async <T>(name: string, table: Parameters<typeof conn.insert>[0], rows: T[]) => {
    if (rows.length) await conn.insert(table).values(rows as never);
    console.log(`  ${name.padEnd(16)} ${rows.length}`);
  };
  const plain = <T extends object>(rows: T[]) => rows.map((r) => into<T>(r as Record<string, unknown>));

  console.log("Seeding:");
  await insert("users", schema.users, plain(d.users));
  await insert("neighbourhoods", schema.neighbourhoods, d.neighbourhoods.map(({ center, ...n }) => ({ ...n, lat: center.lat, lng: center.lng })));
  await insert("agencies", schema.agencies, plain(d.agencies));
  await insert("agents", schema.agents, plain(d.agents));
  await insert("listings", schema.listings, d.listings.map((l) => listingIn(l)));
  await insert("reviews", schema.reviews, plain(d.reviews));
  await insert("saved_searches", schema.savedSearches, plain(d.savedSearches));
  await insert("collections", schema.collections, plain(d.collections));
  await insert("conversations", schema.conversations, plain(d.conversations));
  await insert("messages", schema.messages, plain(d.messages));
  await insert("viewings", schema.viewings, plain(d.viewings));
  await insert("leads", schema.leads, plain(d.leads));
  await insert("offers", schema.offers, plain(d.offers));
  await insert("notifications", schema.notifications, plain(d.notifications));
  await insert("reports", schema.reports, plain(d.reports));
  console.log("Done. Demo accounts use the password Demo@1234.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
