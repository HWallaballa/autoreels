import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Video, Users, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { count: videoCount } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: accountCount } = await supabase
    .from("tiktok_accounts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: scheduledCount } = await supabase
    .from("scheduled_posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("status", "scheduled");

  const { data: recentVideos } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const plan = profile?.plan || "free";
  const videosUsed = profile?.videos_used_this_month || 0;
  const limits: Record<string, number> = {
    free: 0,
    starter: 30,
    pro: 100,
    agency: 500,
  };
  const videoLimit = limits[plan] || 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Welcome back! Here&apos;s an overview of your account.
        </p>
      </div>

      {plan === "free" && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-6 mb-8">
          <h3 className="font-semibold mb-2">
            Subscribe to start creating videos
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Choose a plan to unlock AI video generation and TikTok posting.
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-700 transition"
          >
            View Plans
          </Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Video}
          label="Videos Created"
          value={videoCount || 0}
          sub={
            videoLimit > 0
              ? `${videosUsed}/${videoLimit} this month`
              : undefined
          }
        />
        <StatCard
          icon={Users}
          label="TikTok Accounts"
          value={accountCount || 0}
        />
        <StatCard
          icon={Calendar}
          label="Scheduled Posts"
          value={scheduledCount || 0}
        />
        <StatCard
          icon={TrendingUp}
          label="Current Plan"
          value={plan.charAt(0).toUpperCase() + plan.slice(1)}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Videos</h2>
            <Link
              href="/dashboard/videos"
              className="text-xs text-violet-400 hover:underline"
            >
              View all
            </Link>
          </div>
          {recentVideos && recentVideos.length > 0 ? (
            <div className="space-y-3">
              {recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{video.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={video.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No videos yet.{" "}
              <Link href="/generate" className="text-violet-400 hover:underline">
                Generate your first video
              </Link>
            </p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/generate"
              className="flex items-center gap-3 rounded-lg border border-white/10 p-4 hover:bg-white/5 transition"
            >
              <Video className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-sm font-medium">Generate a Video</p>
                <p className="text-xs text-gray-500">
                  Create a new AI-powered video
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/accounts"
              className="flex items-center gap-3 rounded-lg border border-white/10 p-4 hover:bg-white/5 transition"
            >
              <Users className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-sm font-medium">Connect TikTok Account</p>
                <p className="text-xs text-gray-500">
                  Link a TikTok account for posting
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/schedule"
              className="flex items-center gap-3 rounded-lg border border-white/10 p-4 hover:bg-white/5 transition"
            >
              <Calendar className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-sm font-medium">Schedule a Post</p>
                <p className="text-xs text-gray-500">
                  Set up auto-posting for your videos
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="h-5 w-5 text-violet-500" />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
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
