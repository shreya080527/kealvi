import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const questionId =
    req.nextUrl.searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json(
      { error: "questionId required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("question_answers")
    .select("*")
    .eq("question_id", questionId)
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
  const { questionId, userId, answer } =
    await req.json();

  if (!questionId || !userId || !answer) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("question_answers")
    .insert({
      question_id: questionId,
      user_id: userId,
      answer,
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