import { beforeAll, describe, expect, inject, it } from "vitest";

// Mirrors places.test.ts's shape for the menu-items feature: a menu item
// posted against an existing place shows up on the homepage under that
// place, attached via its real id rather than a fabricated one.
const baseUrl = inject("baseUrl");

describe("menu items", () => {
  let tag: bigint;

  beforeAll(() => {
    tag = process.hrtime.bigint();
  });

  const post = (path: string, body: URLSearchParams) =>
    fetch(new URL(path, baseUrl), {
      method: "POST",
      headers: { origin: baseUrl },
      body,
      redirect: "manual",
    });

  it("attaches a menu item to a place and shows it on reload", async () => {
    const placeName = `menu spec place ${tag}`;
    await post(
      "/api/places",
      new URLSearchParams({
        name: placeName,
        building: "Union Court",
        cuisine: "coffee",
        priceRange: "$",
      }),
    );

    const page = await fetch(baseUrl);
    const body = await page.text();
    expect(body).toContain(placeName);

    // The place's own <option value="id"> in the "add a menu item" form is
    // the only place its id is exposed — read it back rather than assuming
    // one, since other tests and seed data may have inserted places first.
    const escaped = placeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const optionMatch = body.match(new RegExp(`<option value="(\\d+)">${escaped}</option>`));
    expect(optionMatch).not.toBeNull();
    const placeId = optionMatch![1];

    const itemName = `spec item ${tag}`;
    const res = await post(
      "/api/menu-items",
      new URLSearchParams({
        placeId,
        name: itemName,
        price: "$4.20",
        description: "a spec-only menu item",
      }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/");

    const reloaded = await fetch(baseUrl);
    const reloadedBody = await reloaded.text();
    expect(reloadedBody).toContain(itemName);
    expect(reloadedBody).toContain("$4.20");
  });

  it("ignores a menu item posted against a place id that doesn't exist", async () => {
    const itemName = `orphan item ${tag}`;
    const res = await post(
      "/api/menu-items",
      new URLSearchParams({ placeId: "999999", name: itemName }),
    );
    expect(res.status).toBe(303);

    const page = await fetch(baseUrl);
    expect(await page.text()).not.toContain(itemName);
  });
});
