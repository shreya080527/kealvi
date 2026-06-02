import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author, votes(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const questions = (data ?? []).map((q: any) => ({
    id: q.id,
    body: q.body,
    author: q.author,
    votes: q.votes?.[0]?.count ?? 0,
  }));

  return NextResponse.json({
    questions,
    hasMore: false,
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("questions")
    .insert({
      body: body.body,
      author: "Anonymous",
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