import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data: { name },
    });

    return NextResponse.json({ success: true, user: { name: updated.name, email: updated.email } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { name: true, email: true, createdAt: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to get profile" }, { status: 500 });
  }
}
