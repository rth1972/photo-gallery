import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns up to 1 photo per past year taken on the same month+day as today.
// SQLite doesn't have MONTH()/DAY() functions, so we query a date range
// for each year going back up to 10 years.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const today  = new Date();
  const month  = today.getMonth();      // 0-indexed
  const day    = today.getDate();
  const thisYear = today.getFullYear();

  // Build one date-range condition per past year (up to 10 years back)
  const yearConditions = Array.from({ length: 10 }, (_, i) => {
    const y     = thisYear - (i + 1);
    const start = new Date(y, month, day, 0, 0, 0);
    const end   = new Date(y, month, day, 23, 59, 59);
    return { createdAt: { gte: start, lte: end } };
  });

  // Fetch up to 1 photo per year-window, all in one query
  const photos = await prisma.photo.findMany({
    where: {
      userId,
      deletedAt: null,
      archive:   false,
      OR: yearConditions,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, url: true, thumbnail: true,
      width: true, height: true, type: true,
      favorite: true, archive: true, deletedAt: true,
      rotation: true, latitude: true, longitude: true,
      filename: true, createdAt: true, edits: true, aiTags: true,
      exifMake: true, exifModel: true, exifDate: true,
    },
  });

  // Deduplicate to at most 1 photo per year
  const seen  = new Set<number>();
  const picks = photos.filter((p: any) => {
    const y = new Date(p.createdAt).getFullYear();
    if (seen.has(y)) return false;
    seen.add(y);
    return true;
  });

  return NextResponse.json(picks);
}
