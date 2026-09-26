import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, inject, it } from "vitest";

// This repo's own contract, not the starter's: post a card, see it listed
// with its tags/blocks after a reload, and see it ranked among the cards
// it's compatible with — scored per PLAN-matching.md's Jaccard/shared-block
// formula, with zero-overlap pairs excluded from matches entirely.
const baseUrl = inject("baseUrl");
const suffix = process.hrtime.bigint().toString();

type CardInput = {
  name: string;
  contact: string;
  courseCode: string;
  idea: string;
  tags: string[];
  blocks: string[];
};

// Astro checks form POSTs carry a same-origin Origin header (CSRF
// protection); browsers send it automatically, a bare fetch doesn't.
function post(path: string, body: URLSearchParams) {
  return fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body,
    redirect: "manual",
  });
}

function postCard(card: CardInput) {
  const params = new URLSearchParams();
  params.set("name", card.name);
  params.set("contact", card.contact);
  params.set("courseCode", card.courseCode);
  params.set("idea", card.idea);
  for (const tag of card.tags) params.append("tags", tag);
  for (const block of card.blocks) params.append("blocks", block);
  return post("/api/cards", params);
}

async function loadBoard(): Promise<Document> {
  const res = await fetch(baseUrl);
  return new JSDOM(await res.text()).window.document;
}

function articleFor(doc: Document, name: string): Element {
  const article = [...doc.querySelectorAll("article.card")].find(
    (a) => a.querySelector("h2")?.textContent?.trim() === name,
  );
  if (!article) throw new Error(`no card rendered for "${name}"`);
  return article;
}

function matchNames(doc: Document, cardName: string): string[] {
  const matches = articleFor(doc, cardName).querySelector(".matches");
  return [...(matches?.querySelectorAll("li") ?? [])].map((li) => li.textContent ?? "");
}

describe("posting a card", () => {
  const card: CardInput = {
    name: `Card E ${suffix}`,
    contact: `e-${suffix}@example.com`,
    courseCode: "comp 4020",
    idea: "Looking for a study partner",
    tags: ["web"],
    blocks: ["mon-am"],
  };

  it("redirects back to the board", async () => {
    const res = await postCard(card);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/");
  });

  it("persists across a reload, with tags and blocks visible", async () => {
    const doc = await loadBoard();
    const article = articleFor(doc, card.name);
    expect(article.textContent).toContain(card.contact);
    expect(article.textContent).toContain("COMP4020"); // normalized: uppercased, spaces stripped
    expect(article.textContent).toContain(card.idea);
    expect(article.textContent).toContain("web");
    expect(article.textContent).toContain("mon-am");
  });

  it("broadcasts the new card over the SSE stream", async () => {
    const live: CardInput = {
      name: `Live ${suffix}`,
      contact: `live-${suffix}@example.com`,
      courseCode: "COMP4020",
      idea: "SSE probe",
      tags: ["web"],
      blocks: ["mon-am"],
    };

    // subscribe first, then post, then read until the event arrives
    const stream = await fetch(new URL("/api/events", baseUrl));
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    if (!reader) throw new Error("no response body");

    await postCard(live);

    const decoder = new TextDecoder();
    let received = "";
    while (!received.includes(live.name)) {
      const { value, done } = await reader.read();
      if (done) throw new Error("stream ended before the event arrived");
      received += decoder.decode(value, { stream: true });
    }
    await reader.cancel();
    expect(received).toContain("data: ");
    expect(received).toContain(live.name);
  }, 10_000);
});

describe("matches", () => {
  // The worked example from PLAN-matching.md.
  const A: CardInput = {
    name: `A ${suffix}`,
    contact: `a-${suffix}@x.com`,
    courseCode: "COMP4020",
    idea: "x",
    tags: ["web", "ml-data"],
    blocks: ["mon-am", "wed-pm", "fri-am"],
  };
  const B: CardInput = {
    name: `B ${suffix}`,
    contact: `b-${suffix}@x.com`,
    courseCode: "COMP4020",
    idea: "x",
    tags: ["web"],
    blocks: ["mon-am", "tue-eve"],
  };
  const C: CardInput = {
    name: `C ${suffix}`,
    contact: `c-${suffix}@x.com`,
    courseCode: "COMP4020",
    idea: "x",
    tags: ["ml-data", "theory-math"],
    blocks: ["wed-pm", "thu-am"],
  };
  const D: CardInput = {
    name: `D ${suffix}`,
    contact: `d-${suffix}@x.com`,
    courseCode: "COMP4020",
    idea: "x",
    tags: ["game-dev"],
    blocks: ["fri-am"],
  };

  beforeAll(async () => {
    for (const card of [A, B, C, D]) {
      expect((await postCard(card)).status).toBe(303);
    }
  });

  it("A and B match: shared tag and shared block", async () => {
    const doc = await loadBoard();
    expect(matchNames(doc, A.name).join()).toContain(B.name);
    expect(matchNames(doc, B.name).join()).toContain(A.name);
  });

  it("A and C match (shared tag only), A and D match (shared block only)", async () => {
    const doc = await loadBoard();
    expect(matchNames(doc, A.name).join()).toContain(C.name);
    expect(matchNames(doc, A.name).join()).toContain(D.name);
  });

  it("ranks A's matches by score: B above C above D", async () => {
    const doc = await loadBoard();
    const names = matchNames(doc, A.name);
    const indexOf = (needle: string) => names.findIndex((line) => line.includes(needle));
    const [ib, ic, id] = [indexOf(B.name), indexOf(C.name), indexOf(D.name)];
    expect(ib).toBeGreaterThanOrEqual(0);
    expect(ib).toBeLessThan(ic);
    expect(ic).toBeLessThan(id);
  });

  it("B and C never match: fully disjoint", async () => {
    const doc = await loadBoard();
    expect(matchNames(doc, B.name).join()).not.toContain(C.name);
    expect(matchNames(doc, C.name).join()).not.toContain(B.name);
  });

  it("B and D, C and D never match: fully disjoint", async () => {
    const doc = await loadBoard();
    expect(matchNames(doc, B.name).join()).not.toContain(D.name);
    expect(matchNames(doc, D.name).join()).not.toContain(B.name);
    expect(matchNames(doc, C.name).join()).not.toContain(D.name);
    expect(matchNames(doc, D.name).join()).not.toContain(C.name);
  });
});

describe("course code suggestions", () => {
  // The course code field suggests codes already on the board, so typing
  // "COMP402" offers "COMP4020" — via a <datalist>, which the browser
  // filters as you type.
  const code = `SUGG${suffix.slice(-6)}`;

  beforeAll(async () => {
    for (const courseCode of [code.toLowerCase(), code]) {
      const res = await postCard({
        name: `Suggest ${courseCode} ${suffix}`,
        contact: `s-${suffix}@example.com`,
        courseCode,
        idea: "Suggestion probe",
        tags: ["other"],
        blocks: ["weekend"],
      });
      expect(res.status).toBe(303);
    }
  });

  function suggestions(doc: Document): string[] {
    const input = doc.querySelector<HTMLInputElement>("input[name=courseCode]");
    const listId = input?.getAttribute("list");
    expect(listId, "courseCode input has a list attribute").toBeTruthy();
    const datalist = doc.getElementById(listId!);
    expect(datalist?.tagName).toBe("DATALIST");
    return [...datalist!.querySelectorAll("option")].map((o) => o.value);
  }

  it("offers course codes already on the board, normalized", async () => {
    expect(suggestions(await loadBoard())).toContain(code);
  });

  it("lists each code once", async () => {
    expect(suggestions(await loadBoard()).filter((c) => c === code)).toHaveLength(1);
  });
});

describe("validation", () => {
  const valid: CardInput = {
    name: `Valid ${suffix}`,
    contact: "v@x.com",
    courseCode: "COMP4020",
    idea: "x",
    tags: ["web"],
    blocks: ["mon-am"],
  };

  it("rejects a missing required field", async () => {
    const res = await postCard({ ...valid, name: "" });
    expect(res.status).toBe(400);
  });

  it("rejects zero tags", async () => {
    const res = await postCard({ ...valid, tags: [] });
    expect(res.status).toBe(400);
  });

  it("rejects zero availability blocks", async () => {
    const res = await postCard({ ...valid, blocks: [] });
    expect(res.status).toBe(400);
  });

  it("rejects an unrecognised tag value", async () => {
    const res = await postCard({ ...valid, tags: ["not-a-real-tag"] });
    expect(res.status).toBe(400);
  });

  it("never persists a rejected card", async () => {
    const name = `rejected ${suffix}`;
    await postCard({ ...valid, name, tags: [] });
    const res = await fetch(baseUrl);
    expect(await res.text()).not.toContain(name);
  });
});
