"use client";

import { useEffect, useState } from "react";
import { Calendar, RefreshCw, Plus, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

interface ScheduledPost {
  id: string;
  video_id: string;
  tiktok_account_id: string;
  caption: string;
  hashtags: string[];
  scheduled_for: string;
  status: string;
  posted_at: string | null;
  error_message: string | null;
  videos: { title: string; video_url: string } | null;
  tiktok_accounts: { display_name: string } | null;
}

interface VideoOption {
  id: string;
  title: string;
}

interface AccountOption {
  id: string;
  display_name: string;
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    videoId: "",
    accountId: "",
    caption: "",
    hashtags: "",
    scheduledFor: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [postsRes, videosRes, accountsRes] = await Promise.all([
      supabase
        .from("scheduled_posts")
        .select("*, videos(title, video_url), tiktok_accounts(display_name)")
        .eq("user_id", user.id)
        .order("scheduled_for", { ascending: true }),
      supabase
        .from("videos")
        .select("id, title")
        .eq("user_id", user.id)
        .eq("status", "ready"),
      supabase
        .from("tiktok_accounts")
        .select("id, display_name")
        .eq("user_id", user.id),
    ]);

    setPosts((postsRes.data as ScheduledPost[]) || []);
    setVideos(videosRes.data || []);
    setAccounts(accountsRes.data || []);
    setLoading(false);
  }

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: form.videoId,
        tiktokAccountId: form.accountId,
        caption: form.caption,
        hashtags: form.hashtags
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
        scheduledFor: new Date(form.scheduledFor).toISOString(),
      }),
    });

    if (res.ok) {
      setShowForm(false);
      setForm({
        videoId: "",
        accountId: "",
        caption: "",
        hashtags: "",
        scheduledFor: "",
      });
      load();
    }
    setSubmitting(false);
  }

  async function handleDelete(postId: string) {
    if (!confirm("Delete this scheduled post?")) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.from("scheduled_posts").delete().eq("id", postId);
    setPosts(posts.filter((p) => p.id !== postId));
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
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-gray-400 text-sm mt-1">
            Schedule videos to post automatically to TikTok.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-700 transition"
        >
          <Plus className="h-4 w-4" />
          Schedule Post
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSchedule}
          className="rounded-xl border border-white/10 bg-white/5 p-6 mb-8 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Video</label>
              <select
                value={form.videoId}
                onChange={(e) =>
                  setForm({ ...form, videoId: e.target.value })
                }
                required
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm outline-none focus:border-violet-500"
              >
                <option value="">Select a video...</option>
                {videos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                TikTok Account
              </label>
              <select
                value={form.accountId}
                onChange={(e) =>
                  setForm({ ...form, accountId: e.target.value })
                }
                required
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm outline-none focus:border-violet-500"
              >
                <option value="">Select account...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Caption</label>
            <textarea
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm outline-none focus:border-violet-500 resize-none"
              placeholder="Write a catchy caption..."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Hashtags (comma separated)
              </label>
              <input
                value={form.hashtags}
                onChange={(e) =>
                  setForm({ ...form, hashtags: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                placeholder="viral, trending, ai"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Schedule For
              </label>
              <input
                type="datetime-local"
                value={form.scheduledFor}
                onChange={(e) =>
                  setForm({ ...form, scheduledFor: e.target.value })
                }
                required
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50"
            >
              {submitting ? "Scheduling..." : "Schedule Post"}
            </button>
          </div>
        </form>
      )}

      {posts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <Calendar className="h-10 w-10 text-gray-600 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No scheduled posts</h3>
          <p className="text-sm text-gray-500">
            Schedule a video to automatically post to TikTok.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-medium text-sm truncate">
                    {post.videos?.title || "Untitled"}
                  </p>
                  <ScheduleStatusBadge status={post.status} />
                </div>
                <p className="text-xs text-gray-500">
                  {post.tiktok_accounts?.display_name || "Unknown account"} &middot;{" "}
                  {new Date(post.scheduled_for).toLocaleString()}
                </p>
                {post.caption && (
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {post.caption}
                  </p>
                )}
                {post.error_message && (
                  <p className="text-xs text-red-400 mt-1">
                    {post.error_message}
                  </p>
                )}
              </div>
              {post.status === "scheduled" && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="ml-4 rounded-lg border border-white/10 p-2 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    scheduled: "bg-violet-500/20 text-violet-400",
    posting: "bg-yellow-500/20 text-yellow-400",
    posted: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[status] || "bg-gray-500/20 text-gray-400"
      }`}
    >
      {status}
    </span>
  );
}
