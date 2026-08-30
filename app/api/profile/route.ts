import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const input = body as Record<string, unknown>;
  const username = text(input.username, 30).toLowerCase().replace(/[^a-z0-9_]/g, "");
  const avatarUrl = text(input.avatar_url, 2048);
  if (avatarUrl && !/^https:\/\//i.test(avatarUrl)) return NextResponse.json({ error: "Avatar URL must use HTTPS." }, { status: 400 });

  const values = {
    id: userId,
    full_name: text(input.full_name, 100) || null,
    username: username || null,
    avatar_url: avatarUrl || null,
    bio: text(input.bio, 500) || null,
    location: text(input.location, 100) || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("profiles").upsert(values, { onConflict: "id" }).select("id, full_name, username, avatar_url, bio, location").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That username is already taken." : "Unable to save profile." }, { status: 400 });
  return NextResponse.json({ profile: data });
}
