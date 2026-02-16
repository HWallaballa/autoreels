import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { videoId, tiktokAccountId, caption, hashtags, scheduledFor } =
    await req.json();

  if (!videoId || !tiktokAccountId || !scheduledFor) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("scheduled_posts")
    .insert({
      user_id: user.id,
      video_id: videoId,
      tiktok_account_id: tiktokAccountId,
      caption: caption || "",
      hashtags: hashtags || [],
      scheduled_for: scheduledFor,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create scheduled post" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("scheduled_posts")
    .select("*, videos(title, video_url), tiktok_accounts(display_name)")
    .eq("user_id", user.id)
    .order("scheduled_for", { ascending: true });

  return NextResponse.json(data || []);
}
