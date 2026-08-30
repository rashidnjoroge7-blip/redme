import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 5000;
const ALLOWED_CATEGORIES = new Set([
  "Food",
  "Fashion",
  "Travel",
  "Home",
  "Nature",
  "Pets",
  "Books",
  "Beauty",
  "Fitness",
]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function requireUser() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  return { supabase, userId: claimsData?.claims?.sub ?? null };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { supabase, userId } = await requireUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { postId } = await params;
  if (!postId) return NextResponse.json({ error: "Post ID is required." }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const title = cleanText(input.title, MAX_TITLE_LENGTH);
  const description = cleanText(input.description, MAX_DESCRIPTION_LENGTH);
  const category = cleanText(input.category, 40);
  const imageUrl = cleanText(input.imageUrl, 2048);

  if (!title || !ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Valid title and category are required." }, { status: 400 });
  }
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) {
    return NextResponse.json({ error: "Image URL must use HTTPS." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("posts")
    .update({ title, description: description || null, category, image_url: imageUrl || null })
    .eq("id", postId)
    .eq("user_id", userId)
    .select("id, title, description, category, image_url, created_at, user_id, likes_count, comments_count")
    .single();

  if (error) {
    console.error("Post update failed", error);
    return NextResponse.json({ error: "Unable to update post." }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { supabase, userId } = await requireUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { postId } = await params;
  if (!postId) return NextResponse.json({ error: "Post ID is required." }, { status: 400 });

  const { error } = await supabase.from("posts").delete().eq("id", postId).eq("user_id", userId);

  if (error) {
    console.error("Post deletion failed", error);
    return NextResponse.json({ error: "Unable to delete post." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
