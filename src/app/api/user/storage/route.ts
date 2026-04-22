import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storageUsed: true, storageLimit: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      used: Number(user.storageUsed),
      limit: Number(user.storageLimit),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get storage" }, { status: 500 });
  }
}
