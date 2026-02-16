"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Users, Plus, Trash2, RefreshCw } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

interface TikTokAccount {
  id: string;
  tiktok_user_id: string;
  display_name: string;
  connected_at: string;
  scopes: string[];
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  useEffect(() => {
    async function load() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("tiktok_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("connected_at", { ascending: false });

      setAccounts(data || []);
      setLoading(false);
    }
    load();
  }, []);

  function handleConnect() {
    if (!userId) return;
    window.location.href = `/api/auth/tiktok?userId=${userId}`;
  }

  async function handleDisconnect(accountId: string) {
    if (!confirm("Disconnect this TikTok account?")) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.from("tiktok_accounts").delete().eq("id", accountId);
    setAccounts(accounts.filter((a) => a.id !== accountId));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">TikTok Accounts</h1>
          <p className="text-gray-400 text-sm mt-1">
            Connect your TikTok accounts for auto-posting.
          </p>
        </div>
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-700 transition"
        >
          <Plus className="h-4 w-4" />
          Connect Account
        </button>
      </div>

      {success === "connected" && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 mb-6 text-sm text-green-400">
          TikTok account connected successfully!
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-6 text-sm text-red-400">
          Failed to connect account:{" "}
          {error === "tiktok_denied"
            ? "Authorization was denied."
            : error === "token_exchange"
            ? "Token exchange failed."
            : "An error occurred."}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-500" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <Users className="h-10 w-10 text-gray-600 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No accounts connected</h3>
          <p className="text-sm text-gray-500 mb-6">
            Connect a TikTok account to start posting AI-generated videos.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-700 transition"
          >
            <Plus className="h-4 w-4" />
            Connect TikTok Account
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-violet-600/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="font-medium">{account.display_name}</p>
                  <p className="text-xs text-gray-500">
                    Connected{" "}
                    {new Date(account.connected_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDisconnect(account.id)}
                className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
