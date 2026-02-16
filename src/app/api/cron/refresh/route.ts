import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { refreshTikTokToken } from "@/lib/tiktok";

// Refresh TikTok tokens that are expiring within the next 24 hours
// Run daily via cron
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: accounts } = await supabase
    .from("tiktok_accounts")
    .select("*")
    .lt("token_expires_at", tomorrow);

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ message: "No tokens to refresh", refreshed: 0 });
  }

  let refreshed = 0;

  for (const account of accounts) {
    try {
      const tokenData = await refreshTikTokToken(account.refresh_token);

      if (tokenData.access_token) {
        await supabase
          .from("tiktok_accounts")
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || account.refresh_token,
            token_expires_at: new Date(
              Date.now() + tokenData.expires_in * 1000
            ).toISOString(),
          })
          .eq("id", account.id);

        refreshed++;
      } else {
        console.error(
          `Failed to refresh token for account ${account.id}:`,
          tokenData
        );
      }
    } catch (err) {
      console.error(
        `Error refreshing token for account ${account.id}:`,
        err
      );
    }
  }

  return NextResponse.json({
    message: `Refreshed ${refreshed} tokens`,
    refreshed,
    total: accounts.length,
  });
}
