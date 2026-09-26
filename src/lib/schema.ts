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
  // Provenance for menuItems below, set only on places whose menu was
  // researched rather than submitted by a person — e.g. "Google Maps
  // reviews and linked articles" — so the page can flag that data as
  // unverified instead of presenting it as plain fact. Null for
  // person-submitted places, which carry no such claim to caveat.
  menuSource: text("menu_source"),
  menuVerifiedAt: text("menu_verified_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Place = typeof places.$inferSelect;

// One place has many menu items — see PLAN.md's per-item-menu note. price is
// free text, not a number: real listings give prices as "$12.00", "~$3.50+",
// "Included with coffee", or not at all (null), and forcing that into a
// number would either lose information or fake precision that isn't there.
export const menuItems = sqliteTable("menu_items", {
  id: int().primaryKey({ autoIncrement: true }),
  placeId: int("place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  name: text().notNull(),
  price: text(),
  description: text(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type MenuItem = typeof menuItems.$inferSelect;

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
  "Kambri",
  "ANU Sport",
  "University House",
  "Coombs",
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
