import { sql } from "drizzle-orm";
import { int, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Controlled vocabularies for cardTags/cardBlocks — checkbox groups in the
// form, never free text, so the overlap computation matchesFor() depends on
// stays a plain set intersection. See PLAN-matching.md.
export const TAGS = [
  "web",
  "mobile",
  "ml-data",
  "systems-infra",
  "game-dev",
  "hardware-iot",
  "theory-math",
  "other",
] as const;

export const BLOCKS = [
  "mon-am",
  "mon-pm",
  "mon-eve",
  "tue-am",
  "tue-pm",
  "tue-eve",
  "wed-am",
  "wed-pm",
  "wed-eve",
  "thu-am",
  "thu-pm",
  "thu-eve",
  "fri-am",
  "fri-pm",
  "fri-eve",
  "weekend",
] as const;

export type Tag = (typeof TAGS)[number];
export type Block = (typeof BLOCKS)[number];

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.
export const cards = sqliteTable("cards", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  contact: text().notNull(),
  courseCode: text("course_code").notNull(),
  idea: text().notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// A card needs at least one row here — enforced by the /api/cards handler,
// not the schema (SQLite has no easy "at least one child row" constraint).
export const cardTags = sqliteTable(
  "card_tags",
  {
    cardId: int("card_id")
      .notNull()
      .references(() => cards.id),
    tag: text({ enum: TAGS }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.cardId, table.tag] })],
);

export const cardBlocks = sqliteTable(
  "card_blocks",
  {
    cardId: int("card_id")
      .notNull()
      .references(() => cards.id),
    block: text({ enum: BLOCKS }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.cardId, table.block] })],
);

export type Card = typeof cards.$inferSelect;
