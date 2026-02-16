"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, RefreshCw, Wand2, ExternalLink } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

interface VideoRecord {
  id: string;
  title: string;
  prompt: string;
  status: string;
  video_url: string | null;
  generation_model: string;
  created_at: string;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setVideos(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function pollVideo(videoId: string) {
    const res = await fetch(`/api/videos/${videoId}`);
    const updated = await res.json();
    setVideos((prev) => prev.map((v) => (v.id === videoId ? updated : v)));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-5 w-5 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Videos</h1>
          <p className="text-gray-400 text-sm mt-1">
            All your generated videos in one place.
          </p>
        </div>
        <Link
          href="/generate"
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-700 transition"
        >
          <Wand2 className="h-4 w-4" />
          Generate New
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <Video className="h-10 w-10 text-gray-600 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No videos yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Generate your first AI-powered video.
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-700 transition"
          >
            <Wand2 className="h-4 w-4" />
            Generate Video
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
            >
              <div className="aspect-[9/16] max-h-64 bg-black/50 flex items-center justify-center relative">
                {video.status === "ready" && video.video_url ? (
                  <video
                    src={video.video_url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : video.status === "generating" ? (
                  <div className="text-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-violet-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Generating...</p>
                  </div>
                ) : video.status === "failed" ? (
                  <p className="text-xs text-red-400">Generation failed</p>
                ) : (
                  <Video className="h-8 w-8 text-gray-600" />
                )}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={video.status} />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-sm truncate">{video.title}</h3>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {video.prompt}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">
                    {new Date(video.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    {video.status === "generating" && (
                      <button
                        onClick={() => pollVideo(video.id)}
                        className="text-xs text-violet-400 hover:underline"
                      >
                        Check Status
                      </button>
                    )}
                    {video.status === "ready" && video.video_url && (
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ready: "bg-green-500/20 text-green-400",
    posted: "bg-blue-500/20 text-blue-400",
    generating: "bg-yellow-500/20 text-yellow-400",
    failed: "bg-red-500/20 text-red-400",
    pending: "bg-gray-500/20 text-gray-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[status] || colors.pending
      }`}
    >
      {status}
    </span>
  );
}
