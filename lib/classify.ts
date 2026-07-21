import { prisma } from "@/lib/prisma";
import { CaptureType } from "@/generated/prisma/enums";
import type { InputJsonValue } from "@prisma/client/runtime/client";

const GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const VALID_TYPES = Object.values(CaptureType);
const VALID_SOURCE_TYPES = ["reel", "linkedin", "quote", "podcast"] as const;
type SourceType = (typeof VALID_SOURCE_TYPES)[number];

const SYSTEM_PROMPT = `You classify short personal notes for a capture app. Respond with JSON only, no prose.

Pick exactly one "type" from: task, reference, thought, shopping.
- task: something the user needs to do
- reference: a link, quote, article, podcast, or piece of information saved for later
- thought: a stray idea or reflection with no action attached
- shopping: something to buy

Also pick 1-4 short lowercase "tags" (single words or short phrases) relevant to the content.

If (and only if) type is "reference", also include:
- source_url: the URL found in the content, or null if there isn't one
- source_type: one of "reel", "linkedin", "quote", "podcast", inferred from the URL's domain
  (e.g. instagram.com/reel/... or similar short-video links => reel, linkedin.com => linkedin,
  open.spotify.com / podcasts.apple.com or similar => podcast) or from the wording when there's
  no URL (e.g. a quoted saying => quote). Use null if it doesn't clearly match one of those.
For any other type, set source_url and source_type to null.

Respond with exactly this JSON shape and nothing else:
{"type": "task" | "reference" | "thought" | "shopping", "tags": string[], "source_url": string | null, "source_type": "reel" | "linkedin" | "quote" | "podcast" | null}`;

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : raw;
  return JSON.parse(candidate);
}

function extractUrl(content: string): string | null {
  const match = content.match(/https?:\/\/[^\s<>"')\]]+/i);
  if (!match) return null;
  return match[0].replace(/[.,!?;:]+$/, "");
}

export async function classifyCapture(id: string) {
  const capture = await prisma.capture.findUnique({ where: { id } });
  if (!capture) return;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("classifyCapture: GROQ_API_KEY is not set, skipping", id);
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: capture.content },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("classifyCapture: Groq request failed", id, res.status, await res.text());
      return;
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") return;

    const parsed = extractJson(raw) as {
      type?: unknown;
      tags?: unknown;
      source_url?: unknown;
      source_type?: unknown;
    };

    const type = VALID_TYPES.includes(parsed.type as CaptureType)
      ? (parsed.type as CaptureType)
      : null;
    if (!type) {
      console.error("classifyCapture: model returned an unrecognized type", id, parsed.type);
      return;
    }

    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((tag): tag is string => typeof tag === "string")
      : [];

    let typeSpecificData: InputJsonValue = {};
    if (type === CaptureType.reference) {
      // Extract the URL directly from the source text rather than trusting the model's
      // echo of it — regex is authoritative here and avoids hallucinated/mistyped URLs.
      const sourceUrl = extractUrl(capture.content);
      const sourceType = VALID_SOURCE_TYPES.includes(parsed.source_type as SourceType)
        ? (parsed.source_type as SourceType)
        : null;
      typeSpecificData = { source_url: sourceUrl, source_type: sourceType, revisited_at: null };
    }

    await prisma.capture.update({
      where: { id },
      data: { type, tags, typeSpecificData },
    });
  } catch (err) {
    console.error("classifyCapture: failed, leaving capture untagged", id, err);
  } finally {
    clearTimeout(timeout);
  }
}
