import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const pollId = req.nextUrl.searchParams.get("pollId");
  const userId = req.nextUrl.searchParams.get("userId");
  if (!pollId) return NextResponse.json({ error: "pollId required" }, { status: 400 });

  const { data: predictions } = await supabase
    .from("poll_predictions")
    .select("user_id, predicted_option_id, is_correct")
    .eq("poll_id", pollId);

  const counts: Record<string, number> = {};
  for (const p of predictions ?? []) {
    counts[p.predicted_option_id] = (counts[p.predicted_option_id] ?? 0) + 1;
  }

  const userPrediction = userId
    ? (predictions?.find((p) => p.user_id === userId) ?? null)
    : null;

  return NextResponse.json({ counts, userPrediction, total: predictions?.length ?? 0 });
}

export async function POST(req: NextRequest) {
  const { pollId, userId, optionId } = await req.json();
  if (!pollId || !userId || !optionId)
    return NextResponse.json({ error: "pollId, userId, optionId required" }, { status: 400 });

  const { data: poll } = await supabase
    .from("polls")
    .select("is_closed, closes_at")
    .eq("id", pollId)
    .single();

  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  const isClosed = poll.is_closed || (poll.closes_at && new Date(poll.closes_at) < new Date());
  if (isClosed) return NextResponse.json({ error: "Poll is closed — predictions locked" }, { status: 400 });

  await supabase.from("user_profiles").upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

  const { data, error } = await supabase
    .from("poll_predictions")
    .upsert(
      { poll_id: pollId, user_id: userId, predicted_option_id: optionId },
      { onConflict: "poll_id,user_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("award_xp", { p_user_id: userId, p_event: "first_prediction", p_xp: 5, p_ref_id: pollId });
  await supabase.from("user_badges").upsert(
    { user_id: userId, badge_slug: "first_prediction" },
    { onConflict: "user_id,badge_slug", ignoreDuplicates: true }
  );

  return NextResponse.json(data, { status: 201 });
}
