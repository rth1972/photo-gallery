import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tagImageAsync } from "@/lib/aiTagger";
import path from "path";

// POST /api/ai/batch-tags
// Tags all untagged photos for a user, sequentially (Ollama is single-threaded —
// parallel requests just queue inside it and each hits the per-request timeout).

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const photos = await prisma.photo.findMany({
      where: { userId, aiTags: null, type: "photo", deletedAt: null },
      select: { id: true, url: true },
    });

    if (photos.length === 0) {
      return NextResponse.json({ message: "No untagged photos found", tagged: 0, failed: 0 });
    }

    let tagged = 0;
    let failed = 0;

    // Sequential — one at a time so Ollama can actually finish each one
    for (const photo of photos) {
      const filepath = path.join(process.cwd(), photo.url.replace(/^\//, ""));
      console.log(`[batch-tags] Processing ${filepath}`);
      try {
        await tagImageAsync(photo.id, filepath);
        tagged++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      message: `Tagged ${tagged} photos${failed > 0 ? `, ${failed} failed` : ""}`,
      tagged,
      failed,
    });
  } catch (error) {
    console.error("Batch tagging error:", error);
    return NextResponse.json({ error: "Batch tagging failed" }, { status: 500 });
  }
}
