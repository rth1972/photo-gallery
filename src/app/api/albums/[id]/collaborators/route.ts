import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession();
  if (!session?.user) return null;
  return (session.user as any).id;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const albumId = params.id;

  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: {
      collaborators: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const isOwner = album.userId === userId;
  const isCollaborator = album.collaborators.some((c: any) => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json(album.collaborators);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const albumId = params.id;
  const { email, role } = await request.json();

  const album = await prisma.album.findUnique({
    where: { id: albumId },
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  if (album.userId !== userId) {
    return NextResponse.json({ error: "Only owner can add collaborators" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.id === userId) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  }

  const collaborator = await prisma.albumCollaborator.upsert({
    where: {
      albumId_userId: {
        albumId,
        userId: user.id,
      },
    },
    update: { role },
    create: {
      albumId,
      userId: user.id,
      role: role || "editor",
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(collaborator);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const albumId = params.id;
  const { searchParams } = new URL(request.url);
  const collaboratorId = searchParams.get("collaboratorId");

  const album = await prisma.album.findUnique({
    where: { id: albumId },
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  if (album.userId !== userId) {
    return NextResponse.json({ error: "Only owner can remove collaborators" }, { status: 403 });
  }

  if (!collaboratorId) {
    return NextResponse.json({ error: "collaboratorId required" }, { status: 400 });
  }

  await prisma.albumCollaborator.delete({
    where: { id: collaboratorId },
  });

  return NextResponse.json({ success: true });
}