import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id, joined_at, last_read_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load conversations." }, { status: 500 });
  return NextResponse.json({ conversations: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const participantId = body && typeof body === "object" && typeof (body as Record<string, unknown>).userId === "string"
    ? (body as Record<string, unknown>).userId : "";
  if (!participantId || participantId === userId) return NextResponse.json({ error: "Choose another user." }, { status: 400 });

  const { data: conversation, error: conversationError } = await supabase.from("conversations").insert({}).select("id").single();
  if (conversationError || !conversation) return NextResponse.json({ error: "Unable to create conversation." }, { status: 500 });

  const { error: participantsError } = await supabase.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: userId },
    { conversation_id: conversation.id, user_id: participantId },
  ]);

  if (participantsError) return NextResponse.json({ error: "Unable to add conversation participants." }, { status: 500 });
  return NextResponse.json({ conversation }, { status: 201 });
}
