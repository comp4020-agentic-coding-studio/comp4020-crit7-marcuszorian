import { beforeAll, describe, expect, inject, it } from "vitest";

// Our own spec tests, mirroring guestbook.test.ts's shape: the two
// mechanically checkable promises from PLAN.md for the campus food finder —
// a submitted place survives a reload, and filtering by building/cuisine
// actually narrows the list. Written before the API exists (POST
// /api/places, GET /?building=&cuisine=), so this file is red until
// schema.ts, db.ts and the routes land — that's the point of writing it
// first.
const baseUrl = inject("baseUrl");

describe("places", () => {
  let tag: bigint;

  beforeAll(() => {
    tag = process.hrtime.bigint();
  });

  // Astro checks form POSTs carry a same-origin Origin header (CSRF
  // protection); browsers send it automatically, a bare fetch doesn't.
  const post = (path: string, body: URLSearchParams) =>
    fetch(new URL(path, baseUrl), {
      method: "POST",
      headers: { origin: baseUrl },
      body,
      redirect: "manual",
    });

  it("accepts a place and persists it across a reload", async () => {
    const name = `spec place ${tag}`;
    const res = await post(
      "/api/places",
      new URLSearchParams({
        name,
        building: "Union Court",
        cuisine: "coffee",
        priceRange: "$",
        locationNote: "near the ANU bar",
      }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/");

    const page = await fetch(baseUrl);
    expect(await page.text()).toContain(name);
  });

  it("narrows the list when filtered by building and cuisine", async () => {
    const unionCoffee = `union coffee ${tag}`;
    const hancockBakery = `hancock bakery ${tag}`;

    await post(
      "/api/places",
      new URLSearchParams({
        name: unionCoffee,
        building: "Union Court",
        cuisine: "coffee",
        priceRange: "$",
      }),
    );
    await post(
      "/api/places",
      new URLSearchParams({
        name: hancockBakery,
        building: "Hancock",
        cuisine: "bakery",
        priceRange: "$",
      }),
    );

    const unfiltered = await fetch(baseUrl);
    const unfilteredBody = await unfiltered.text();
    expect(unfilteredBody).toContain(unionCoffee);
    expect(unfilteredBody).toContain(hancockBakery);

    const filteredUrl = new URL("/", baseUrl);
    filteredUrl.searchParams.set("building", "Union Court");
    filteredUrl.searchParams.set("cuisine", "coffee");
    const filtered = await fetch(filteredUrl);
    const filteredBody = await filtered.text();
    expect(filteredBody).toContain(unionCoffee);
    expect(filteredBody).not.toContain(hancockBakery);
  });
});
