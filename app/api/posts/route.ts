import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 5000;
const ALLOWED_CATEGORIES = new Set(["Food", "Fashion", "Travel", "Home", "Nature", "Pets", "Books", "Beauty", "Fitness"]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validPostMediaUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.pathname.includes("/storage/v1/object/public/post-media/");
  } catch { return false; }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  const input = body as Record<string, unknown>;
  const title = cleanText(input.title, MAX_TITLE_LENGTH);
  const description = cleanText(input.description, MAX_DESCRIPTION_LENGTH);
  const category = cleanText(input.category, 40);
  const imageUrl = cleanText(input.imageUrl, 2048);
  if (!title) return NextResponse.json({ error: "A post title is required." }, { status: 400 });
  if (!ALLOWED_CATEGORIES.has(category)) return NextResponse.json({ error: "Choose a valid post category." }, { status: 400 });
  if (!validPostMediaUrl(imageUrl)) return NextResponse.json({ error: "Post image must be uploaded to RedNote storage." }, { status: 400 });
  const { data, error } = await supabase.from("posts").insert({ user_id: userId, title, description: description || null, category, image_url: imageUrl || null }).select("id, title, description, category, image_url, created_at, user_id, likes_count, comments_count").single();
  if (error) { console.error("Post creation failed", error); return NextResponse.json({ error: "Unable to create post." }, { status: 500 }); }
  return NextResponse.json({ post: data }, { status: 201 });
}
