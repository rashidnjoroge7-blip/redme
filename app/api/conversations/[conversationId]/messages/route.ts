import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_BODY_LENGTH = 4000;

async function authorizedClient(conversationId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { supabase, userId: null, authorized: false };

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  return { supabase, userId, authorized: Boolean(participant) };
}

export async function GET(_request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const { supabase, authorized } = await authorizedClient((await params).conversationId);
  if (!authorized) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  const conversationId = (await params).conversationId;
  const { data, error } = await supabase.from("messages").select("id, conversation_id, sender_id, body, created_at, edited_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(100);
  if (error) return NextResponse.json({ error: "Unable to load messages." }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const conversationId = (await params).conversationId;
  const { supabase, userId, authorized } = await authorizedClient(conversationId);
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!authorized) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const content = body && typeof body === "object" && typeof (body as Record<string, unknown>).body === "string" ? (body as Record<string, unknown>).body.trim().slice(0, MAX_BODY_LENGTH) : "";
  if (!content) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });

  const { data, error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: userId, body: content }).select("id, conversation_id, sender_id, body, created_at, edited_at").single();
  if (error) return NextResponse.json({ error: "Unable to send message." }, { status: 400 });
  return NextResponse.json({ message: data }, { status: 201 });
}
