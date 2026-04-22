import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(process.cwd(), "uploads", ...params.path);
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    const file = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    const contentTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
    };
    
    const contentType = contentTypes[ext] || "application/octet-stream";
    
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json({ error: "File error" }, { status: 500 });
  }
}
