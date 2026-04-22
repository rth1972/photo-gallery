import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const photoId = params.id;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";
    
    if (!photoId) {
      return NextResponse.json({ error: "photoId required" }, { status: 400 });
    }
    
    if (permanent) {
      await prisma.photo.delete({
        where: { id: photoId },
      });
    } else {
      await prisma.photo.update({
        where: { id: photoId },
        data: { deletedAt: new Date() },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, albumId, value } = body;
    const photoId = params.id;
    
    if (!photoId || !action) {
      return NextResponse.json({ error: "photoId and action required" }, { status: 400 });
    }
    
    if (action === "restore") {
      const updated = await prisma.photo.update({
        where: { id: photoId },
        data: { deletedAt: null },
      });
      return NextResponse.json({ success: true, photo: updated });
    }
    
    if (action === "favorite") {
      const updated = await prisma.photo.update({
        where: { id: photoId },
        data: { favorite: value !== false },
      });
      return NextResponse.json({ success: true, photo: updated });
    }
    
    if (action === "archive") {
      const updated = await prisma.photo.update({
        where: { id: photoId },
        data: { archive: value !== false },
      });
      return NextResponse.json({ success: true, photo: updated });
    }
    
    if (action === "rotation") {
      const updated = await prisma.photo.update({
        where: { id: photoId },
        data: { rotation: value },
      });
      return NextResponse.json({ success: true, photo: updated });
    }
    
    if (action === "edits") {
      const updated = await prisma.photo.update({
        where: { id: photoId },
        data: { edits: JSON.stringify(value) },
      });
      return NextResponse.json({ success: true, photo: updated });
    }
    
    if (action === "moveToAlbum" && albumId) {
      await prisma.photoOnAlbum.create({
        data: {
          photoId,
          albumId,
        },
      });
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return PATCH(request, { params });
}