import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("polls")
    .select(`
      *,
      poll_options (
        id,
        option_text,
        vote_count
      )
    `)
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
  try {
    const body = await req.json();

    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        question: body.question,
        category: body.category ?? "general",
        closes_at: body.closesAt,
      })
      .select()
      .single();

    if (pollError) throw pollError;

    const options = body.options.map((option: string) => ({
      poll_id: poll.id,
      option_text: option,
    }));

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(options);

    if (optionsError) throw optionsError;

    return NextResponse.json(
      { success: true, pollId: poll.id },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}



















