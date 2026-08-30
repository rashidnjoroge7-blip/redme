import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const supabase = await createClient();
  const { postId } = await params;

  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, content, created_at, updated_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "Unable to load comments." }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { postId } = await params;

  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!postId) return NextResponse.json({ error: "Post ID is required." }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const content = body && typeof body === "object" && typeof (body as Record<string, unknown>).content === "string"
    ? (body as Record<string, unknown>).content.trim().slice(0, 2000)
    : "";

  if (!content) return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });

  const payload: { post_id: string; user_id: string; content: string } = {
    post_id: postId,
    user_id: userId,
    content,
  };
  const { data, error } = await supabase
    .from("comments")
    .insert(payload as never)
    .select("id, post_id, user_id, content, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: "Unable to create comment." }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}
