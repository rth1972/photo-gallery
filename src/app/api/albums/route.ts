import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const albumId = searchParams.get("albumId");
  const shareToken = searchParams.get("shareToken");
  
  // Public album view via share link
  if (shareToken) {
    const album = await prisma.album.findFirst({
      where: { shareLink: shareToken },
      include: {
        photos: {
          include: { photo: true },
        },
      },
    });
    
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
    
    return NextResponse.json(album);
  }
  
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  
  if (albumId) {
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: { 
        photos: {
          include: { photo: true },
          take: 1,
          orderBy: { photo: { createdAt: "desc" } },
        },
        collaborators: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { photos: true } },
      },
    });
    if (album && album.photos.length > 0 && !album.coverPhoto) {
      album.coverPhoto = album.photos[0].photo.thumbnail;
    }
    return NextResponse.json(album);
  }
  
  // Get albums owned by user and where user is a collaborator
  const albums = await prisma.album.findMany({
    where: {
      OR: [
        { userId },
        { collaborators: { some: { userId } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { photos: true } },
      photos: {
        include: { photo: true },
        take: 1,
        orderBy: { photo: { createdAt: "desc" } },
      },
    },
  });
  
  return NextResponse.json(albums.map((a: any) => ({
    ...a,
    photoCount: a._count.photos,
    coverPhoto: a.coverPhoto || (a.photos[0]?.photo.thumbnail || null),
  })));
}

export async function POST(request: Request) {
  try {
    const { userId, name } = await request.json();
    
    if (!userId || !name) {
      return NextResponse.json({ error: "userId and name required" }, { status: 400 });
    }
    
    const album = await prisma.album.create({
      data: {
        userId,
        name,
      },
    });
    
    return NextResponse.json({ success: true, album });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { albumId, action, coverPhotoId } = body;
    
    if (!albumId || !action) {
      return NextResponse.json({ error: "albumId and action required" }, { status: 400 });
    }
    
    let album;
    
    if (action === "setCover" && coverPhotoId) {
      const photo = await prisma.photo.findUnique({
        where: { id: coverPhotoId },
      });
      
      album = await prisma.album.update({
        where: { id: albumId },
        data: {
          coverPhoto: photo?.url,
          coverPhotoId: coverPhotoId,
        },
      });
    }
    
    if (action === "share") {
      const shareToken = randomBytes(16).toString("hex");
      album = await prisma.album.update({
        where: { id: albumId },
        data: {
          isShared: true,
          shareLink: shareToken,
        },
      });
    }
    
    if (action === "unshare") {
      album = await prisma.album.update({
        where: { id: albumId },
        data: {
          isShared: false,
          shareLink: null,
        },
      });
    }
    
    return NextResponse.json({ success: true, album });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update album" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("albumId");
    
    if (!albumId) {
      return NextResponse.json({ error: "albumId required" }, { status: 400 });
    }
    
    await prisma.album.delete({
      where: { id: albumId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete album" }, { status: 500 });
  }
}
