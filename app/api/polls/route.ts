import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: polls, error } = await supabase
    .from("polls")
    .select(`
      id,
      question,
      poll_options (
        id,
        option_text,
        poll_votes(count)
      )
    `);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const formatted = polls?.map((poll: any) => ({
    ...poll,
    poll_options: poll.poll_options.map((option: any) => ({
      ...option,
      vote_count: option.poll_votes?.[0]?.count ?? 0,
    })),
  }));

  return NextResponse.json(formatted);
}