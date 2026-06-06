import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const pollId = req.nextUrl.searchParams.get("pollId");
  const voterId = req.nextUrl.searchParams.get("voterId");
  if (!pollId || !voterId)
    return NextResponse.json({ error: "pollId and voterId required" }, { status: 400 });

  const { data } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", pollId)
    .eq("voter_id", voterId)
    .single();

  return NextResponse.json({ currentVote: data?.option_id ?? null });
}

export async function POST(req: NextRequest) {
  const { optionId, pollId, voterId } = await req.json();
  if (!optionId || !pollId || !voterId)
    return NextResponse.json({ error: "optionId, pollId, voterId required" }, { status: 400 });

  const { data: poll } = await supabase
    .from("polls")
    .select("is_closed, closes_at, creator_id")
    .eq("id", pollId)
    .single();

  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  const isClosed = poll.is_closed || (poll.closes_at && new Date(poll.closes_at) < new Date());
  if (isClosed) return NextResponse.json({ error: "Poll is closed" }, { status: 400 });

  await supabase.from("user_profiles").upsert({ id: voterId }, { onConflict: "id", ignoreDuplicates: true });

  const { data: existing } = await supabase
    .from("poll_votes")
    .select("id, option_id")
    .eq("poll_id", pollId)
    .eq("voter_id", voterId)
    .single();

  if (existing) {
    if (existing.option_id === optionId) {
      await supabase.from("poll_votes").delete().eq("id", existing.id);
      await supabase.rpc("decrement_option_vote", { p_option_id: optionId });
      return NextResponse.json({ action: "removed" });
    } else {
      await supabase.from("poll_votes").update({ option_id: optionId, voted_at: new Date().toISOString() }).eq("id", existing.id);
      await supabase.rpc("decrement_option_vote", { p_option_id: existing.option_id });
      await supabase.rpc("increment_option_vote", { p_option_id: optionId });
      return NextResponse.json({ action: "switched" });
    }
  }

  await supabase.from("poll_votes").insert({ poll_id: pollId, option_id: optionId, voter_id: voterId });
  await supabase.rpc("increment_option_vote", { p_option_id: optionId });
  await supabase.rpc("award_xp", { p_user_id: voterId, p_event: "poll_vote_cast", p_xp: 2, p_ref_id: pollId });

  if (poll.creator_id && poll.creator_id !== voterId) {
    await supabase.rpc("award_xp", { p_user_id: poll.creator_id, p_event: "poll_received_vote", p_xp: 3, p_ref_id: pollId });
  }

  await supabase.rpc("update_streak", { p_user_id: voterId });
  await supabase.from("user_badges").upsert(
    { user_id: voterId, badge_slug: "first_poll_vote" },
    { onConflict: "user_id,badge_slug", ignoreDuplicates: true }
  );

  return NextResponse.json({ action: "voted" });
}