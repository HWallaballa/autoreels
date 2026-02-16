import { NextRequest, NextResponse } from "next/server";
import { exchangeTikTokCode } from "@/lib/tiktok";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/accounts?error=tiktok_denied`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/accounts?error=missing_params`
    );
  }

  // Decode state to get user ID
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());
    userId = decoded.userId;
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/accounts?error=invalid_state`
    );
  }

  // Exchange code for tokens
  const tokenData = await exchangeTikTokCode(code);

  if (tokenData.error) {
    console.error("TikTok token exchange error:", tokenData);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/accounts?error=token_exchange`
    );
  }

  const supabase = createServiceClient();

  // Store the connected account
  await supabase.from("tiktok_accounts").insert({
    user_id: userId,
    tiktok_user_id: tokenData.open_id,
    display_name: tokenData.open_id, // TikTok doesn't return display name in token response
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_expires_at: new Date(
      Date.now() + tokenData.expires_in * 1000
    ).toISOString(),
    scopes: tokenData.scope?.split(",") || [],
  });

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/accounts?success=connected`
  );
}
