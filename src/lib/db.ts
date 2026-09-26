import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { type Block, type Card, type Tag, cardBlocks, cardTags, cards } from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

export type { Card };

export type CardWithMatchData = Card & { tags: Tag[]; blocks: Block[] };
export type Match = { card: CardWithMatchData; score: number };

export type NewCard = {
  name: string;
  contact: string;
  courseCode: string;
  idea: string;
  tags: Tag[];
  blocks: Block[];
};

// Attaches each card's tags/blocks in 2 extra queries total, not one per
// card — the join tables exist so overlap is computable, not so every page
// render re-queries per card.
function attachTagsAndBlocks(rows: Card[]): CardWithMatchData[] {
  const tagRows = db.select().from(cardTags).all();
  const blockRows = db.select().from(cardBlocks).all();

  const tagsByCard = new Map<number, Tag[]>();
  for (const row of tagRows) {
    const list = tagsByCard.get(row.cardId) ?? [];
    list.push(row.tag);
    tagsByCard.set(row.cardId, list);
  }

  const blocksByCard = new Map<number, Block[]>();
  for (const row of blockRows) {
    const list = blocksByCard.get(row.cardId) ?? [];
    list.push(row.block);
    blocksByCard.set(row.cardId, list);
  }

  return rows.map((card) => ({
    ...card,
    tags: tagsByCard.get(card.id) ?? [],
    blocks: blocksByCard.get(card.id) ?? [],
  }));
}

export function listCards(): CardWithMatchData[] {
  return attachTagsAndBlocks(db.select().from(cards).orderBy(asc(cards.id)).all());
}

export function insertCard(input: NewCard): CardWithMatchData {
  return db.transaction((tx) => {
    const card = tx
      .insert(cards)
      .values({
        name: input.name,
        contact: input.contact,
        courseCode: input.courseCode,
        idea: input.idea,
      })
      .returning()
      .get();

    if (input.tags.length > 0) {
      tx.insert(cardTags)
        .values(input.tags.map((tag) => ({ cardId: card.id, tag })))
        .run();
    }
    if (input.blocks.length > 0) {
      tx.insert(cardBlocks)
        .values(input.blocks.map((block) => ({ cardId: card.id, block })))
        .run();
    }

    return { ...card, tags: input.tags, blocks: input.blocks };
  });
}

// score(A, B) = 100 * tagJaccard(A, B) + 10 * sharedBlocks(A, B), per
// PLAN-matching.md. Tags are normalized (Jaccard) so posting more tags
// doesn't by itself inflate a match; availability is a raw shared count,
// since more overlapping free time is strictly easier to meet in regardless
// of how many blocks either side listed overall.
export function score(
  a: { tags: Tag[]; blocks: Block[] },
  b: { tags: Tag[]; blocks: Block[] },
): number {
  const tagsA = new Set(a.tags);
  const tagsB = new Set(b.tags);
  const sharedTags = [...tagsA].filter((tag) => tagsB.has(tag)).length;
  const unionTags = new Set([...tagsA, ...tagsB]).size;
  const tagJaccard = unionTags === 0 ? 0 : sharedTags / unionTags;

  const blocksA = new Set(a.blocks);
  const blocksB = new Set(b.blocks);
  const sharedBlocks = [...blocksA].filter((block) => blocksB.has(block)).length;

  return 100 * tagJaccard + 10 * sharedBlocks;
}

// Scores `cardId` against every other card in an already-fetched list, so
// rendering the whole board's matches costs one listCards() call, not one
// per card. A pair with a score of exactly 0 is excluded entirely — no
// shared tag or block means "not a match," not "a weak match."
export function rankMatches(all: CardWithMatchData[], cardId: number, limit = 20): Match[] {
  const target = all.find((card) => card.id === cardId);
  if (!target) return [];

  return all
    .filter((card) => card.id !== cardId)
    .map((card) => ({ card, score: score(target, card) }))
    .filter((match) => match.score > 0)
    .sort((x, y) => y.score - x.score || x.card.id - y.card.id)
    .slice(0, limit);
}

export function matchesFor(cardId: number, limit = 20): Match[] {
  return rankMatches(listCards(), cardId, limit);
}

// Seeds the board once, at first boot, so the crit demo shows real matches
// rather than an empty or single-card list. Guarded by "table is empty"
// rather than a migration-time INSERT (migrations stay a pure schema diff)
// or a separate script (nothing would force it to run before a deploy).
// Safe to re-check on every boot: this app has no delete path, so an empty
// table can only mean "this volume has never been seeded."
const SEED_CARDS: NewCard[] = [
  {
    name: "Priya",
    contact: "priya.d@example.com",
    courseCode: "COMP4020",
    idea: "Building a small React dashboard for a group project.",
    tags: ["web", "ml-data"],
    blocks: ["mon-am", "wed-pm", "fri-am"],
  },
  {
    name: "Sam",
    contact: "@sam-codes",
    courseCode: "COMP4020",
    idea: "Want a frontend partner, happy to own the backend.",
    tags: ["web"],
    blocks: ["mon-am", "tue-eve"],
  },
  {
    name: "Jordan",
    contact: "jordan.k@example.com",
    courseCode: "COMP3670",
    idea: "Looking to study ML theory together before the exam.",
    tags: ["ml-data", "theory-math"],
    blocks: ["wed-pm", "thu-am"],
  },
  {
    name: "Alex",
    contact: "alex.chen@example.com",
    courseCode: "COMP2100",
    idea: "Making a small co-op game for the studio unit.",
    tags: ["game-dev"],
    blocks: ["fri-am", "fri-pm"],
  },
  {
    name: "Morgan",
    contact: "@morgan.iot",
    courseCode: "COMP3702",
    idea: "Prototyping a sensor network for a hardware elective.",
    tags: ["hardware-iot", "systems-infra"],
    blocks: ["tue-am", "thu-pm"],
  },
  {
    name: "Taylor",
    contact: "taylor.b@example.com",
    courseCode: "COMP4020",
    idea: "Study group for the distributed systems assignment.",
    tags: ["systems-infra"],
    blocks: ["tue-am", "weekend"],
  },
  {
    name: "Riley",
    contact: "riley.o@example.com",
    courseCode: "COMP1100",
    idea: "New to CS and after a study buddy for the intro course.",
    tags: ["other"],
    blocks: ["weekend"],
  },
  {
    name: "Devon",
    contact: "@devon-mobile",
    courseCode: "COMP3530",
    idea: "Cross-platform mobile app for a capstone idea.",
    tags: ["mobile"],
    blocks: ["mon-pm", "wed-eve"],
  },
];

if (listCards().length === 0) {
  for (const card of SEED_CARDS) insertCard(card);
}
