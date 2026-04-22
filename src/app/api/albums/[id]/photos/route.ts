import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const albumId = params.id;
    
    const photos = await prisma.photoOnAlbum.findMany({
      where: { albumId },
      include: { photo: true },
      orderBy: { photo: { createdAt: "desc" } },
    });
    
    return NextResponse.json(photos.map((p: any) => p.photo));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get photos" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const albumId = params.id;
    const { photoIds } = await request.json();
    
    if (!photoIds || !albumId) {
      return NextResponse.json({ error: "photoIds and albumId required" }, { status: 400 });
    }
    
    for (const photoId of photoIds) {
      const existing = await prisma.photoOnAlbum.findUnique({
        where: {
          photoId_albumId: { photoId, albumId },
        },
      });
      
      if (!existing) {
        await prisma.photoOnAlbum.create({
          data: { photoId, albumId },
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding photos to album:", error);
    return NextResponse.json({ error: "Failed to add photos to album" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");
    const albumId = searchParams.get("albumId");
    
    if (!photoId || !albumId) {
      return NextResponse.json({ error: "photoId and albumId required" }, { status: 400 });
    }
    
    await prisma.photoOnAlbum.delete({
      where: {
        photoId_albumId: { photoId, albumId },
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove photo from album" }, { status: 500 });
  }
}