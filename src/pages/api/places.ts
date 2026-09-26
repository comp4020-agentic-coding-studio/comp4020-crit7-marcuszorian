import type { APIRoute } from "astro";
import { insertPlace } from "../../lib/db";
import { BUILDINGS, CUISINES, PRICE_RANGES } from "../../lib/schema";

// The write half of the directory: a plain HTML form POSTs here, the place
// goes into SQLite, and the 303 redirect re-renders the list from the
// database — no client-side JavaScript needed.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim().slice(0, 200);
  const building = String(form.get("building") ?? "");
  const cuisine = String(form.get("cuisine") ?? "");
  const priceRange = String(form.get("priceRange") ?? "");
  const locationNote = String(form.get("locationNote") ?? "").trim().slice(0, 280);

  const valid =
    name &&
    (BUILDINGS as readonly string[]).includes(building) &&
    (CUISINES as readonly string[]).includes(cuisine) &&
    (PRICE_RANGES as readonly string[]).includes(priceRange);

  if (valid) {
    insertPlace({
      name,
      building,
      cuisine,
      priceRange,
      locationNote: locationNote || undefined,
    });
  }

  return redirect("/", 303);
};
