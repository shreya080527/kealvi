import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();

  const { error } = await supabase
    .from("poll_votes")
    .insert({
      option_id: body.optionId,
    });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
  });
}