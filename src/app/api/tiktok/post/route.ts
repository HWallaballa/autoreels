import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { postVideoToTikTok } from "@/lib/tiktok";

export async function POST(req: NextRequest) {
  const { videoId, tiktokAccountId, caption, hashtags } = await req.json();

  if (!videoId || !tiktokAccountId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get the video
  const { data: video } = await supabase
    .from("videos")
    .select("*")
    .eq("id", videoId)
    .single();

  if (!video || video.status !== "ready" || !video.video_url) {
    return NextResponse.json({ error: "Video not ready" }, { status: 400 });
  }

  // Get the TikTok account
  const { data: account } = await supabase
    .from("tiktok_accounts")
    .select("*")
    .eq("id", tiktokAccountId)
    .single();

  if (!account) {
    return NextResponse.json({ error: "TikTok account not found" }, { status: 404 });
  }

  // Build caption with hashtags
  const fullCaption = hashtags?.length
    ? `${caption || ""} ${hashtags.map((h: string) => `#${h}`).join(" ")}`.trim()
    : caption || "";

  // Post to TikTok
  const result = await postVideoToTikTok(
    account.access_token,
    video.video_url,
    fullCaption
  );

  if (result.error) {
    return NextResponse.json(
      { error: "TikTok posting failed", details: result.error },
      { status: 500 }
    );
  }

  // Update video status
  await supabase
    .from("videos")
    .update({ status: "posted" })
    .eq("id", videoId);

  return NextResponse.json({ success: true, tiktokResponse: result });
}
