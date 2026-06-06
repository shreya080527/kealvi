import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Upsert profile so it always exists
  await supabase
    .from("user_profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: badges } = await supabase
    .from("user_badges")
    .select("badge_slug, earned_at, badges(name, icon, description, xp_reward)")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  const { data: recentXp } = await supabase
    .from("xp_events")
    .select("event_type, xp_delta, created_at, ref_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  // XP needed for next level: level^2 * 50
  const xpForNextLevel = profile
    ? Math.pow(profile.level, 2) * 50
    : 50;
  const xpForCurrentLevel = profile
    ? Math.pow(profile.level - 1, 2) * 50
    : 0;

  return NextResponse.json({
    profile,
    badges: badges ?? [],
    recentXp: recentXp ?? [],
    progress: {
      xpForCurrentLevel,
      xpForNextLevel,
      xpInCurrentLevel: profile ? profile.xp - xpForCurrentLevel : 0,
      xpNeededForNextLevel: profile ? xpForNextLevel - profile.xp : 50,
    },
  });
}