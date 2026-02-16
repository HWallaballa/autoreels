import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getPredictionStatus } from "@/lib/replicate";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: video } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // If still generating, check Replicate status
  if (video.status === "generating" && video.replicate_prediction_id) {
    const prediction = await getPredictionStatus(video.replicate_prediction_id);

    if (prediction.status === "succeeded" && prediction.output) {
      const videoUrl = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;

      await supabase
        .from("videos")
        .update({ status: "ready", video_url: videoUrl })
        .eq("id", video.id);

      return NextResponse.json({ ...video, status: "ready", video_url: videoUrl });
    }

    if (prediction.status === "failed") {
      await supabase
        .from("videos")
        .update({ status: "failed" })
        .eq("id", video.id);

      return NextResponse.json({ ...video, status: "failed" });
    }
  }

  return NextResponse.json(video);
}
