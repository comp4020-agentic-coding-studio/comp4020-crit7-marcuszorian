import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { type Place, places } from "./schema";

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

export type { Place };

export interface PlaceFilter {
  building?: string;
  cuisine?: string;
}

export function listPlaces(filter: PlaceFilter = {}): Place[] {
  const conditions = [
    filter.building ? eq(places.building, filter.building) : undefined,
    filter.cuisine ? eq(places.cuisine, filter.cuisine) : undefined,
  ].filter((condition) => condition !== undefined);

  return db
    .select()
    .from(places)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(places.id))
    .all();
}

export interface NewPlace {
  name: string;
  building: string;
  cuisine: string;
  priceRange: string;
  locationNote?: string;
}

export function insertPlace(place: NewPlace): Place {
  return db.insert(places).values(place).returning().get();
}

// Seed a handful of known campus places on first boot, so the crit demo
// isn't an empty list. Guarded on the table being empty, so it never
// clobbers real submissions on a redeploy of a volume that already has data.
const SEED_PLACES: NewPlace[] = [
  {
    name: "Union Court Food Court",
    building: "Union Court",
    locationNote: "ground floor, multiple stalls",
    cuisine: "food-court",
    priceRange: "$$",
  },
  {
    name: "Coffee Grounds",
    building: "Union Court",
    locationNote: "near the ANU bar",
    cuisine: "coffee",
    priceRange: "$",
  },
  {
    name: "Culture on Lena",
    building: "Union Court",
    cuisine: "western",
    priceRange: "$$",
  },
  {
    name: "Copland Cafe",
    building: "Copland",
    locationNote: "ground floor foyer",
    cuisine: "coffee",
    priceRange: "$",
  },
  {
    name: "Hancock Bakery",
    building: "Hancock",
    cuisine: "bakery",
    priceRange: "$",
  },
  {
    name: "Chifley Noodle Bar",
    building: "Chifley",
    locationNote: "near the library entrance",
    cuisine: "asian",
    priceRange: "$$",
  },
  {
    name: "Marie Reay Study Cafe",
    building: "Marie Reay",
    cuisine: "coffee",
    priceRange: "$",
  },
  {
    name: "RSC Halal Grill",
    building: "RSC",
    cuisine: "halal",
    priceRange: "$$",
  },
  {
    name: "JCSMR Kiosk",
    building: "JCSMR",
    cuisine: "vegetarian-friendly",
    priceRange: "$",
  },
  {
    name: "Union Court Pizza",
    building: "Union Court",
    cuisine: "western",
    priceRange: "$$$",
  },
];

if (listPlaces().length === 0) {
  for (const place of SEED_PLACES) {
    insertPlace(place);
  }
}
