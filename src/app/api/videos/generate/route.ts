import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { generateVideoAsync } from "@/lib/replicate";

export async function POST(req: NextRequest) {
  const { prompt, title, userId } = await req.json();

  if (!prompt || !userId) {
    return NextResponse.json({ error: "Missing prompt or userId" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Check user's plan limits
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, videos_used_this_month")
    .eq("id", userId)
    .single();

  if (!profile || profile.plan === "free") {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  }

  const limits: Record<string, number> = {
    starter: 30,
    pro: 100,
    agency: 500,
  };
  const limit = limits[profile.plan] || 0;

  if (profile.videos_used_this_month >= limit) {
    return NextResponse.json(
      { error: "Monthly video limit reached. Upgrade your plan for more." },
      { status: 429 }
    );
  }

  // Create video record
  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      user_id: userId,
      title: title || "Untitled",
      prompt,
      status: "generating",
      generation_model: "minimax/video-01-live",
    })
    .select()
    .single();

  if (insertError || !video) {
    return NextResponse.json({ error: "Failed to create video record" }, { status: 500 });
  }

  // Start async video generation
  try {
    const prediction = await generateVideoAsync(prompt);

    await supabase
      .from("videos")
      .update({ replicate_prediction_id: prediction.id })
      .eq("id", video.id);

    // Increment usage counter
    await supabase
      .from("profiles")
      .update({ videos_used_this_month: profile.videos_used_this_month + 1 })
      .eq("id", userId);

    return NextResponse.json({ videoId: video.id, predictionId: prediction.id });
  } catch (error) {
    await supabase
      .from("videos")
      .update({ status: "failed" })
      .eq("id", video.id);

    console.error("Video generation error:", error);
    return NextResponse.json({ error: "Video generation failed" }, { status: 500 });
  }
}
