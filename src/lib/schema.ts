import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.
export const places = sqliteTable("places", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  building: text().notNull(),
  locationNote: text("location_note"),
  cuisine: text().notNull(),
  priceRange: text("price_range").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Place = typeof places.$inferSelect;

// Fixed lists behind the form's <select>s — see PLAN.md's "controlled
// vocabularies": free text on building/cuisine fragments a filter ("asian" vs
// "Asian" vs "chinese"), so both are closed sets, extended here as places get
// added rather than typed by the form.
export const BUILDINGS = [
  "Union Court",
  "Copland",
  "Hancock",
  "Chifley",
  "Marie Reay",
  "RSC",
  "JCSMR",
] as const;

export const CUISINES = [
  "coffee",
  "bakery",
  "asian",
  "western",
  "halal",
  "vegetarian-friendly",
  "food-court",
  "other",
] as const;

export const PRICE_RANGES = ["$", "$$", "$$$"] as const;
