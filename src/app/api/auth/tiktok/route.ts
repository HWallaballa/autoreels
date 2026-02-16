import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getTikTokAuthUrl } from "@/lib/tiktok";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // State contains the user ID for the callback to know who's connecting
  const state = Buffer.from(JSON.stringify({ userId, nonce: randomUUID() })).toString("base64");
  const authUrl = getTikTokAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
