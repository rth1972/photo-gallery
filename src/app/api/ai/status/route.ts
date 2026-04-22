import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { 
      method: "GET",
      signal: SignalTimeout(5000)
    });
    
    if (res.ok) {
      return NextResponse.json({ available: true });
    }
    return NextResponse.json({ available: false });
  } catch {
    return NextResponse.json({ available: false });
  }
}

function SignalTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}