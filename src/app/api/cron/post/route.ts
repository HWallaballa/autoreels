import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { postVideoToTikTok } from "@/lib/tiktok";

// This endpoint should be called by a cron job (e.g., every minute via Vercel Cron)
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find posts that are due
  const { data: duePosts } = await supabase
    .from("scheduled_posts")
    .select(
      "*, videos(video_url), tiktok_accounts(access_token)"
    )
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .limit(10);

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ message: "No posts due", processed: 0 });
  }

  let processed = 0;

  for (const post of duePosts) {
    // Mark as posting
    await supabase
      .from("scheduled_posts")
      .update({ status: "posting" })
      .eq("id", post.id);

    const videoUrl = (post.videos as { video_url: string })?.video_url;
    const accessToken = (post.tiktok_accounts as { access_token: string })
      ?.access_token;

    if (!videoUrl || !accessToken) {
      await supabase
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: "Missing video URL or account token",
        })
        .eq("id", post.id);
      continue;
    }

    // Build caption with hashtags
    const fullCaption = post.hashtags?.length
      ? `${post.caption || ""} ${post.hashtags.map((h: string) => `#${h}`).join(" ")}`.trim()
      : post.caption || "";

    try {
      const result = await postVideoToTikTok(accessToken, videoUrl, fullCaption);

      if (result.error) {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: JSON.stringify(result.error),
          })
          .eq("id", post.id);
      } else {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "posted",
            tiktok_post_id: result.data?.publish_id || null,
            posted_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        // Also update the video status
        await supabase
          .from("videos")
          .update({ status: "posted" })
          .eq("id", post.video_id);

        processed++;
      }
    } catch (err) {
      await supabase
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", post.id);
    }
  }

  return NextResponse.json({
    message: `Processed ${processed} posts`,
    processed,
    total: duePosts.length,
  });
}
