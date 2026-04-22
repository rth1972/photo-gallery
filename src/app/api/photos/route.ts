import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";
import ExifReader from "exifreader";
import ffmpeg from "fluent-ffmpeg";
import { tagImageAsync } from "@/lib/aiTagger";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractGPS(buffer: Buffer): { latitude?: number; longitude?: number } | null {
  try {
    const tags = ExifReader.load(buffer, { expanded: true });
    if (!tags.gps) return null;
    const lat = tags.gps.Latitude as number;
    const lon = tags.gps.Longitude as number;
    if (typeof lat !== "number" || typeof lon !== "number") return null;
    if (lat > 90 || lat < -90 || lon > 180 || lon < -180) return null;
    return { latitude: lat, longitude: lon };
  } catch { return null; }
}

function extractEXIF(buffer: Buffer) {
  try {
    const tags = ExifReader.load(buffer, { expanded: true });
    return {
      make:              tags.exif?.Make?.description,
      model:             tags.exif?.Model?.description,
      dateTimeOriginal:  tags.exif?.DateTimeOriginal?.description,
    };
  } catch { return {}; }
}

function generateVideoThumbnail(inputPath: string, outputPath: string): Promise<string | null> {
  return new Promise(resolve => {
    ffmpeg(inputPath)
      .screenshots({ timestamps: ["00:00:01"], filename: path.basename(outputPath), folder: path.dirname(outputPath), size: "300x300" })
      .on("end",   () => resolve(outputPath))
      .on("error", () => resolve(null));
  });
}

// ─── GET /api/photos ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const userId      = sp.get("userId");
  const includeTrash= sp.get("includeTrash") === "true";
  const favorite    = sp.get("favorite");
  const archive     = sp.get("archive");
  const search      = sp.get("search");
  const tagsSearch  = sp.get("tags");          // content/AI tag search
  const startDate   = sp.get("startDate");
  const endDate     = sp.get("endDate");
  const cursor      = sp.get("cursor") ?? undefined;
  const take        = Math.min(Number(sp.get("take") ?? 200), 500);

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const where: any = { userId };
  where.deletedAt = includeTrash ? { not: null } : null;
  if (favorite === "true") where.favorite = true;
  if (archive  === "true") where.archive  = true;
  if (!archive && !includeTrash) where.archive = false;

  // Search: filename OR aiTags contain the query
  if (search || tagsSearch) {
    const q = search || tagsSearch!;
    where.OR = [
      { filename: { contains: q } },
      { aiTags:   { contains: q } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate)   where.createdAt.lte = new Date(endDate + "T23:59:59");
  }

  const photos = await prisma.photo.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true, url: true, thumbnail: true,
      width: true, height: true, type: true,
      favorite: true, archive: true, deletedAt: true,
      rotation: true, latitude: true, longitude: true,
      filename: true, createdAt: true, edits: true, aiTags: true,
      exifMake: true, exifModel: true, exifDate: true,
    },
  });

  const nextCursor = photos.length === take ? photos[photos.length - 1].id : null;

  return NextResponse.json(
    { photos, nextCursor },
    { headers: { "Cache-Control": "private, max-age=0, stale-while-revalidate=30" } }
  );
}

// ─── POST /api/photos — upload ────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId   = formData.get("userId") as string;
    const file     = formData.get("file")   as File;

    if (!userId || !file) {
      return NextResponse.json({ error: "userId and file required" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "uploads", userId);
    if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });

    const bytes    = await file.arrayBuffer();
    const buffer   = Buffer.from(bytes);
    const fileSize = buffer.length;

    const ext      = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    const isVideo  = file.type.startsWith("video/") || /\.(mp4|mov|avi|mpg|mkv|webm)$/i.test(file.name);

    await writeFile(filepath, buffer);

    // ── Real dimensions from original ─────────────────────────────────────────
    let imageWidth  = 1200;
    let imageHeight = 800;

    if (!isVideo) {
      try {
        const meta = await sharp(buffer).metadata();
        imageWidth  = meta.width  ?? 1200;
        imageHeight = meta.height ?? 800;
        // EXIF orientations 5–8 transpose width and height
        if (meta.orientation && meta.orientation >= 5) {
          [imageWidth, imageHeight] = [imageHeight, imageWidth];
        }
      } catch { /* keep defaults */ }
    }

    // ── Generate thumbnail ────────────────────────────────────────────────────
    let thumbnailUrl = `/uploads/${userId}/${filename}`;

    if (!isVideo) {
      try {
        const thumbFilename = `thumb_${Date.now()}.webp`;
        const thumbFilepath = path.join(uploadsDir, thumbFilename);
        await sharp(buffer)
          .rotate()
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(thumbFilepath);
        thumbnailUrl = `/uploads/${userId}/${thumbFilename}`;
      } catch (e) {
        console.error("Thumbnail generation failed:", e);
      }
    } else {
      const thumbFilename = `thumb_${filename.replace(/\.[^.]+$/, ".jpg")}`;
      const thumbFilepath = path.join(uploadsDir, thumbFilename);
      const thumb = await generateVideoThumbnail(filepath, thumbFilepath);
      if (thumb) thumbnailUrl = `/uploads/${userId}/${thumbFilename}`;
    }

    const gpsData  = isVideo ? null : extractGPS(buffer);
    const exifData = isVideo ? null : extractEXIF(buffer);

    const photo = await prisma.photo.create({
      data: {
        userId, filename,
        url:       `/uploads/${userId}/${filename}`,
        thumbnail: thumbnailUrl,
        width:  imageWidth,
        height: imageHeight,
        type:   isVideo ? "video" : "photo",
        latitude:  gpsData?.latitude,
        longitude: gpsData?.longitude,
        exifMake:  exifData?.make,
        exifModel: exifData?.model,
        exifDate:  exifData?.dateTimeOriginal,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data:  { storageUsed: { increment: fileSize } },
    });

    // ── AI tagging — fire-and-forget, never blocks the response ──────────────
    // Do NOT await — just call it. Node.js keeps the async function alive
    // after the response is sent. setTimeout is wrong here: Next.js tears down
    // the execution context before the timer fires.
    if (!isVideo) {
      tagImageAsync(photo.id, filepath).catch(e =>
        console.error("[AI] Tagging failed for", photo.id, e?.message ?? e)
      );
    }

    return NextResponse.json({ success: true, photo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// ─── DELETE /api/photos ───────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const sp        = new URL(request.url).searchParams;
    const photoId   = sp.get("photoId");
    const permanent = sp.get("permanent") === "true";

    if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

    const photo = await prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

    if (permanent) {
      const filepath = path.join(process.cwd(), "uploads", photo.userId, photo.filename);
      if (existsSync(filepath)) await unlink(filepath);
      await prisma.user.update({
        where: { id: photo.userId },
        // Use actual file size — read from disk if possible, else rough estimate
        data: { storageUsed: { decrement: (await import("fs")).statSync(filepath.replace(/\.(webp|jpg)$/, "")).size ?? fileSize(photo) } },
      }).catch(() => {}); // storage update is best-effort
      await prisma.photo.delete({ where: { id: photoId } });
    } else {
      await prisma.photo.update({ where: { id: photoId }, data: { deletedAt: new Date() } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

function fileSize(_photo: any) { return 0; } // fallback — storage update is best-effort

// ─── PATCH /api/photos ────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  try {
    const { photoId, action, value } = await request.json();
    if (!photoId || !action) return NextResponse.json({ error: "photoId and action required" }, { status: 400 });

    const data: any = {};
    switch (action) {
      case "restore":  data.deletedAt = null;         break;
      case "favorite": data.favorite  = value !== false; break;
      case "archive":  data.archive   = value !== false; break;
      case "rotation": data.rotation  = value;        break;
      case "edits":    data.edits     = JSON.stringify(value); break;
      default: return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const photo = await prisma.photo.update({ where: { id: photoId }, data });
    return NextResponse.json({ success: true, photo });
  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
