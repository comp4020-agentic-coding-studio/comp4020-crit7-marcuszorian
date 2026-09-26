import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { type MenuItem, type Place, menuItems, places } from "./schema";

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

export type { Place, MenuItem };

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
  menuSource?: string;
  menuVerifiedAt?: string;
}

export function insertPlace(place: NewPlace): Place {
  return db.insert(places).values(place).returning().get();
}

export function getPlace(id: number): Place | undefined {
  return db.select().from(places).where(eq(places.id, id)).get();
}

export interface NewMenuItem {
  name: string;
  price?: string;
  description?: string;
}

export function insertMenuItem(placeId: number, item: NewMenuItem): MenuItem {
  return db.insert(menuItems).values({ placeId, ...item }).returning().get();
}

// One query for every place on the page, grouped in memory, rather than one
// query per place — the N+1 that's easy to reach for in a .map() over rows.
export function listMenuItemsByPlace(placeIds: number[]): Map<number, MenuItem[]> {
  if (placeIds.length === 0) return new Map();
  const rows = db.select().from(menuItems).where(inArray(menuItems.placeId, placeIds)).all();
  const byPlace = new Map<number, MenuItem[]>();
  for (const row of rows) {
    const list = byPlace.get(row.placeId);
    if (list) list.push(row);
    else byPlace.set(row.placeId, [row]);
  }
  return byPlace;
}

// A price of exactly "Not listed" is Gemini saying it found no price, not a
// price — store that as no price rather than a string that reads like one.
function normalizePrice(price: string): string | undefined {
  return price.trim().toLowerCase() === "not listed" ? undefined : price;
}

// Seed a handful of known campus places on first boot, so the crit demo
// isn't an empty list. Guarded on the table being empty, so it never
// clobbers real submissions on a redeploy of a volume that already has data.
//
// Sourced from a Gemini research pass over Google Maps (2026-09-26), not
// hand-verified against the actual venues — see each place's menuSource on
// the page for the caveat that displays alongside it. Only covers the
// buildings that pass turned up matches for; the rest of BUILDINGS is real
// coverage waiting on more places being added, not a gap in the seed.
const SEED: Array<{ place: NewPlace; items: NewMenuItem[] }> = [
  {
    place: {
      name: "Badger & Co",
      building: "Kambri",
      locationNote: "Campus pub located in the Kambri Precinct.",
      cuisine: "western",
      priceRange: "$$",
      menuSource: "linked website",
      menuVerifiedAt: "2026-09-26",
    },
    items: [
      { name: "Badger Fries", price: "$12.00", description: "Crispy fries, Badger's signature seasoning and comeback sauce" },
      { name: "Hot Wings", price: "$17.00", description: "Signature chicken wings, hot sauce and ranch dressing" },
      { name: "Margherita Pizza", price: "$22.00", description: "Tomato sugo base, bocconcini, basil, sliced tomato and mozzarella" },
      { name: "Fish & Chips", price: "$24.00", description: "Beer battered Australian Hoki, side salad, chips, lemon and tartare sauce" },
      { name: "Chicken Schnitzel", price: "$25.00", description: "Crumbed chicken schnitzel, side salad, chips and your choice of sauce" },
    ],
  },
  {
    place: {
      name: "Gangnam Lane 江南道",
      building: "Kambri",
      locationNote: "Takeaway food spot offering Korean street food in the Kambri precinct.",
      cuisine: "asian",
      priceRange: "$",
      menuSource: "linked website",
      menuVerifiedAt: "2026-09-26",
    },
    items: [{ name: "Lunch bowl", price: "$10.80", description: "Special offer customised lunch bowl" }],
  },
  {
    place: {
      name: "Yori Canberra Poke",
      building: "Kambri",
      locationNote: "Poke bowl shop in Kambri.",
      cuisine: "asian",
      priceRange: "$$",
      menuSource: "Google Maps reviews and linked articles",
      menuVerifiedAt: "2026-09-26",
    },
    items: [
      { name: "Signature Poke Bowl", price: "~$20.00", description: "Signature poke bowl (price estimated from reviews)" },
      { name: "Wagyu Steak Bowl", description: "Wagyu steak poke bowl" },
      { name: "Chilli Soy Beef Bowl", description: "Chilli soy beef poke bowl" },
      { name: "Sweet and Spicy Tofu Bowl", description: "Vegetarian sweet and spicy tofu poke bowl" },
      { name: "Signature Salmon Bowl", description: "Signature salmon poke bowl" },
      { name: "Sashimi Platter", description: "Fresh sashimi platter variety" },
      { name: "Prawn Tempura", description: "Prawn tempura side dish" },
      { name: "Fried Chicken", description: "Fried chicken side dish" },
      { name: "Futomaki", description: "Large Japanese sushi roll" },
    ],
  },
  {
    place: {
      name: "Craft Beans",
      building: "Marie Reay",
      locationNote: "Cafe offering coffee on the ground floor of the Marie Reay Teaching Centre.",
      cuisine: "coffee",
      priceRange: "$",
      menuSource: "Google Maps reviews and local university articles",
      menuVerifiedAt: "2026-09-26",
    },
    items: [
      { name: "Coffee & Cold Brew", description: "Various espresso and cold brew options with different bean blends" },
      { name: "Fresh-squeezed Juices", description: "Freshly squeezed juice options" },
      { name: "House Cookie", price: "Included with coffee", description: "House-baked biscuits/cookies, flavours rotate daily" },
    ],
  },
  {
    place: {
      name: "Tasa Coffee House",
      building: "ANU Sport",
      locationNote: "Coffee house with courtyard seating at ANU Sport.",
      cuisine: "coffee",
      priceRange: "$",
      menuSource: "Google Maps reviews",
      menuVerifiedAt: "2026-09-26",
    },
    items: [
      { name: "Chiksilog", description: "Filipino breakfast dish with chicken, garlic fried rice, and egg" },
      { name: "Tapsilog", description: "Beef tapa with garlic fried rice and fried egg" },
      { name: "Taro Latte", description: "Taro flavoured latte" },
      { name: "Matcha Latte", description: "Matcha flavoured latte" },
      { name: "Donuts", description: "Fresh donuts" },
    ],
  },
  {
    place: {
      name: "LAB ANU",
      building: "Kambri",
      locationNote: "Cafe and bar offering brunch and coffee.",
      cuisine: "coffee",
      priceRange: "$$",
      menuSource: "Google Maps reviews and linked articles",
      menuVerifiedAt: "2026-09-26",
    },
    items: [
      { name: "Chicken Parmi", price: "~$20.00", description: "Chicken Parmigiana (estimated price from reviews)" },
      { name: "Scrambled Eggs on Toast", description: "Scrambled eggs served on toast" },
      { name: "Burgers", description: "Lunchtime burgers" },
      { name: "Sandwiches", description: "Pre-made sandwiches and wraps" },
      { name: "Quiche", description: "Savoury quiche" },
    ],
  },
  {
    place: {
      name: "Symposium by University House",
      building: "University House",
      locationNote: "Wine bar offering small plates, platters, and seasonal lunches.",
      cuisine: "western",
      priceRange: "$$",
      menuSource: "Google Maps reviews and linked articles",
      menuVerifiedAt: "2026-09-26",
    },
    items: [
      { name: "Smoked Duck", description: "Tender smoked duck small plate" },
      { name: "Miso Eggplant", description: "Miso-glazed eggplant" },
      { name: "Reuben Sandwich", description: "Modern take on a Reuben sandwich with roast beef" },
      { name: "Vegan Platter", description: "Assorted vegan platter options" },
      { name: "Cheese and Charcuterie", description: "Cheese and charcuterie platter options" },
      { name: "Dip Platter", description: "Assorted dips platter" },
    ],
  },
  {
    place: {
      name: "thegodscafe",
      building: "Coombs",
      locationNote: "Campus cafe known for coffee and breakfast items.",
      cuisine: "coffee",
      priceRange: "$",
      menuSource: "Google Maps reviews and linked blog review",
      menuVerifiedAt: "2026-09-26",
    },
    items: [
      { name: "P-Y-T-T-I-P-A-N-N-A", price: "$16.00", description: "Swedish-style breakfast with stir-fry potatoes, bacon, onion, beetroot, and a fried egg (from an older review)" },
      { name: "Mango Smoothie", price: "$7.00", description: "Mango smoothie (from an older review)" },
      { name: "Sandwiches", description: "Assorted cafe sandwiches" },
      { name: "Sushi", description: "Pre-made sushi options" },
    ],
  },
  {
    place: {
      name: "The Vanilla Bean Café",
      building: "JCSMR",
      locationNote: "Located downstairs in the John Curtin School of Medical Research (JCSMR).",
      cuisine: "coffee",
      priceRange: "$",
      menuSource: "Google Maps reviews (website under construction)",
      menuVerifiedAt: "2026-09-26",
    },
    items: [
      { name: "Burgers", description: "Cafe style burgers" },
      { name: "Daily Specials", description: "Fixed menu and daily food specials" },
    ],
  },
  {
    place: {
      name: "Rex Espresso",
      building: "Kambri",
      locationNote: "Coffee shop within the Kambri precinct catering to on-the-go students.",
      cuisine: "coffee",
      priceRange: "$",
      menuSource: "Google Maps reviews and local university articles",
      menuVerifiedAt: "2026-09-26",
    },
    items: [
      { name: "Chicken Avocado Panini", description: "Chicken and avocado pressed panini" },
      { name: "Pre-prepared Rolls", description: "Assorted pre-prepared rolls" },
      { name: "Cakes & Pastries", description: "Selection of cakes and baked pastries" },
      { name: "Coffee", price: "~$3.50+", description: "Various espresso beverages (estimated from reviews)" },
    ],
  },
];

if (listPlaces().length === 0) {
  for (const { place, items } of SEED) {
    const inserted = insertPlace(place);
    for (const item of items) {
      insertMenuItem(inserted.id, { ...item, price: item.price ? normalizePrice(item.price) : undefined });
    }
  }
}
