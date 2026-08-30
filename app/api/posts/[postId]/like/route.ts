import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { postId } = await params;

  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!postId) return NextResponse.json({ error: "Post ID is required." }, { status: 400 });

  const { data: existing, error: lookupError } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: "Unable to check like state." }, { status: 500 });

  if (existing) {
    const { error } = await supabase.from("likes").delete().eq("user_id", userId).eq("post_id", postId);
    if (error) return NextResponse.json({ error: "Unable to remove like." }, { status: 500 });
    return NextResponse.json({ liked: false });
  }

  const { error } = await supabase.from("likes").insert({ user_id: userId, post_id: postId });
  if (error) return NextResponse.json({ error: "Unable to like post." }, { status: 500 });

  return NextResponse.json({ liked: true });
}
