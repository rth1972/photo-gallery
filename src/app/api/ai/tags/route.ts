import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tagImageAsync } from "@/lib/aiTagger";
import path from "path";

// POST /api/ai/tags — tag a single photo on demand
// Only requires photoId — userId is resolved server-side from the DB.

export async function POST(request: Request) {
  try {
    const { photoId } = await request.json();
    if (!photoId) {
      return NextResponse.json({ error: "photoId required" }, { status: 400 });
    }

    const photo = await prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

    const filepath = path.join(process.cwd(), photo.url.replace(/^\//, ""));
    await tagImageAsync(photo.id, filepath);

    const updated = await prisma.photo.findUnique({
      where: { id: photoId },
      select: { aiTags: true },
    });

    const tags = updated?.aiTags ? JSON.parse(updated.aiTags) : [];
    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error("AI tagging error:", error);
    return NextResponse.json({ error: "Failed to generate tags" }, { status: 500 });
  }
}
