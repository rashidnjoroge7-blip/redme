import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const followerId = claimsData?.claims?.sub;
  const { userId: followingId } = await params;

  if (!followerId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!followingId || followerId === followingId) {
    return NextResponse.json({ error: "Invalid user to follow." }, { status: 400 });
  }

  const { data: existing, error: lookupError } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: "Unable to check follow state." }, { status: 500 });

  if (existing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) return NextResponse.json({ error: "Unable to unfollow user." }, { status: 500 });
    return NextResponse.json({ following: false });
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) return NextResponse.json({ error: "Unable to follow user." }, { status: 500 });
  return NextResponse.json({ following: true });
}
