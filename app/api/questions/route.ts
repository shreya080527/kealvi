import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");

  let query = supabase
    .from("questions")
    .select("id, body, author, votes(count)")
    .order("created_at", { ascending: false })
    .limit(10);

  if (q) {
    query = query.ilike("body", `%${q}%`);
  }

  const { data, error } = await query;

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

const text = body.body.trim();

const { data: existing } = await supabase
  .from("questions")
  .select("id")
  .ilike("body", text)
  .maybeSingle();

if (existing) {
  return NextResponse.json(
    { error: "Question already asked" },
    { status: 409 }
  );
}

const { data, error } = await supabase
  .from("questions")
  .insert({
    body: text,
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