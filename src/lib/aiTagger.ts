import { prisma } from "@/lib/prisma";
import { readFileSync } from "fs";

const OLLAMA_URL  = process.env.OLLAMA_URL  ?? "http://localhost:11434";
const OLLAMA_MODEL= process.env.OLLAMA_MODEL ?? "llava:latest";

// Timeout per image — 120s. Ollama is single-threaded; one image at a time.
const TIMEOUT_MS = 120_000;

// ─── Tag cleaning ─────────────────────────────────────────────────────────────

function cleanTag(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    // strip leading/trailing punctuation (periods, commas, quotes, asterisks…)
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .trim();
}

function parseTags(text: string): string[] {
  // 1. Strip markdown fences  ```json … ```  or  ``` … ```
  const stripped = text
    .replace(/^```[a-z]*\s*/im, "")
    .replace(/\s*```$/im, "")
    .trim();

  // 2. Try JSON array first
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) {
      const tags = parsed
        .map((t: unknown) => cleanTag(String(t)))
        .filter((t) => t.length > 0 && t.length < 60);
      if (tags.length > 0) return tags.slice(0, 8);
    }
  } catch {
    // not JSON — fall through
  }

  // 3. Comma-separated fallback  (e.g. "dog, park, sunny")
  const parts = stripped
    .split(",")
    .map((s) => cleanTag(s))
    .filter((s) => s.length > 0 && s.length < 60 && !s.includes("\n"));

  if (parts.length >= 2) return parts.slice(0, 8);

  // 4. Give up
  return [];
}

// ─── Core tagger ─────────────────────────────────────────────────────────────

export async function tagImageAsync(
  photoId: string,
  filepath: string
): Promise<void> {
  let b64: string;
  try {
    b64 = readFileSync(filepath).toString("base64");
  } catch (err) {
    console.error(`[AI] Cannot read file for photo ${photoId}:`, err);
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        // Explicit, tight prompt — reduces non-JSON responses significantly
        prompt:
          "List what you see in this photo as a JSON array of 3-8 short lowercase tags. " +
          "Include objects, scene type, colours, and mood. " +
          'Reply with ONLY the JSON array. Example: ["beach","sunset","orange sky","calm"]. ' +
          "No explanations, no markdown, no extra text.",
        images: [b64],
        stream: false,
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.error(`[AI] Ollama returned HTTP ${res.status} for photo ${photoId}`);
      return;
    }

    const data = await res.json();
    const rawText = (data.response ?? "").trim();
    const tags = parseTags(rawText);

    if (tags.length === 0) {
      console.error(`[AI] Could not extract tags from response for photo ${photoId}. Raw: "${rawText.slice(0, 150)}"`);
      return;
    }

    await prisma.photo.update({
      where: { id: photoId },
      data:  { aiTags: JSON.stringify(tags) },
    });

    console.log(`[AI] Tagged photo ${photoId}:`, tags);
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      console.error(`[AI] Timed out tagging photo ${photoId} after ${TIMEOUT_MS / 1000}s`);
    } else {
      console.error(`[AI] Error tagging photo ${photoId}:`, err?.message ?? err);
    }
  }
}

// ─── Sequential batch tagger ──────────────────────────────────────────────────
// Ollama runs one model inference at a time. Processing images in parallel
// just causes them to queue up inside Ollama and hit the per-request timeout.
// Sequential is slower total but every individual image actually completes.

export async function tagPhotosSequentially(
  photos: Array<{ id: string; filepath: string }>
): Promise<{ tagged: number; failed: number }> {
  let tagged = 0;
  let failed = 0;

  for (const photo of photos) {
    try {
      await tagImageAsync(photo.id, photo.filepath);
      tagged++;
    } catch {
      failed++;
    }
  }

  return { tagged, failed };
}
