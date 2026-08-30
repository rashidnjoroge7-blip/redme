import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_BODY_LENGTH = 4000;

type NewMessage = {
  conversation_id: string;
  sender_id: string;
  body: string;
};

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
  const conversationId = (await params).conversationId;
  const { supabase, authorized } = await authorizedClient(conversationId);
  if (!authorized) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
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
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawBody = body && typeof body === "object" ? (body as Record<string, unknown>).body : undefined;
  const content = typeof rawBody === "string" ? rawBody.trim().slice(0, MAX_BODY_LENGTH) : "";
  if (!content) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });

  const payload: NewMessage = { conversation_id: conversationId, sender_id: userId, body: content };
  const { data, error } = await supabase.from("messages").insert(payload as never).select("id, conversation_id, sender_id, body, created_at, edited_at").single();
  if (error) return NextResponse.json({ error: "Unable to send message." }, { status: 400 });
  return NextResponse.json({ message: data }, { status: 201 });
}
