import type { APIRoute } from "astro";
import { insertCard } from "../../lib/db";
import { bus } from "../../lib/events";
import { BLOCKS, type Block, TAGS, type Tag } from "../../lib/schema";

const isTag = (value: string): value is Tag => (TAGS as readonly string[]).includes(value);
const isBlock = (value: string): value is Block => (BLOCKS as readonly string[]).includes(value);

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const contact = String(form.get("contact") ?? "").trim();
  const courseCode = String(form.get("courseCode") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const idea = String(form.get("idea") ?? "")
    .trim()
    .slice(0, 280);
  const tags = [...new Set(form.getAll("tags").map(String))];
  const blocks = [...new Set(form.getAll("blocks").map(String))];

  const problem = !name
    ? "name is required"
    : !contact
      ? "contact is required"
      : !courseCode
        ? "courseCode is required"
        : !idea
          ? "idea is required"
          : tags.length === 0
            ? "pick at least one tag"
            : blocks.length === 0
              ? "pick at least one availability block"
              : !tags.every(isTag)
                ? "unrecognised tag"
                : !blocks.every(isBlock)
                  ? "unrecognised availability block"
                  : null;

  if (problem) {
    return new Response(`Bad request: ${problem}`, { status: 400 });
  }

  const card = insertCard({ name, contact, courseCode, idea, tags: tags as Tag[], blocks: blocks as Block[] });
  bus.emit("card", card);
  return redirect("/", 303);
};
