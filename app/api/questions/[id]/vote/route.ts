import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: questionId } = await context.params;
  const { voterId } = await req.json();

  return NextResponse.json({
    questionId,
    voterId,
  });
}