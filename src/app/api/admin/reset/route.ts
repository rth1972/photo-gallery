import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// POST /api/admin/reset
// Deletes every photo, album, collaborator record and all upload files on disk.
// Users are preserved. The secret header prevents accidental calls.
//
// Usage:
//   curl -X POST http://localhost:3000/api/admin/reset \
//        -H "x-reset-secret: pixelbox-reset"

const RESET_SECRET = process.env.RESET_SECRET ?? "pixelbox-reset";

export async function POST(request: Request) {
  // Simple secret check — not production-grade auth, just a foot-gun guard
  const secret = request.headers.get("x-reset-secret");
  if (secret !== RESET_SECRET) {
    return NextResponse.json({ error: "Forbidden — wrong x-reset-secret header" }, { status: 403 });
  }

  try {
    // ── 1. Delete all DB rows (order matters for FK constraints) ──────────────
    await prisma.$transaction([
      prisma.photoOnAlbum.deleteMany(),
      prisma.albumCollaborator.deleteMany(),
      prisma.album.deleteMany(),
      prisma.photo.deleteMany(),
    ]);

    // ── 2. Reset storageUsed on every user ────────────────────────────────────
    await prisma.user.updateMany({ data: { storageUsed: 0 } });

    // ── 3. Delete every file inside /uploads/* (one folder per userId) ────────
    const uploadsRoot = path.join(process.cwd(), "uploads");
    if (existsSync(uploadsRoot)) {
      // Remove and recreate the entire uploads directory
      await rm(uploadsRoot, { recursive: true, force: true });
    }

    return NextResponse.json({
      success: true,
      message: "All photos, albums, and upload files deleted. Users preserved.",
    });
  } catch (err: any) {
    console.error("Reset failed:", err);
    return NextResponse.json({ error: err?.message ?? "Reset failed" }, { status: 500 });
  }
}
