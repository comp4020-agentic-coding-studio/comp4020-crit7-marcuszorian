import type { APIRoute } from "astro";
import { getPlace, insertMenuItem } from "../../lib/db";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const placeId = Number(form.get("placeId"));
  const name = String(form.get("name") ?? "").trim().slice(0, 200);
  const price = String(form.get("price") ?? "").trim().slice(0, 40);
  const description = String(form.get("description") ?? "").trim().slice(0, 280);

  if (name && Number.isInteger(placeId) && getPlace(placeId)) {
    insertMenuItem(placeId, {
      name,
      price: price || undefined,
      description: description || undefined,
    });
  }

  return redirect("/", 303);
};
