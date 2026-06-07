import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const pollId = req.nextUrl.searchParams.get("pollId");

  if (!pollId) {
    return NextResponse.json(
      { error: "pollId required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("poll_comments")
    .select("*")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { pollId, userId, comment } =
    await req.json();

  if (!pollId || !userId || !comment) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("poll_comments")
    .insert({
      poll_id: pollId,
      user_id: userId,
      comment,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}