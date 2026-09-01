import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isAvatarStorageUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.pathname.startsWith("/storage/v1/object/public/avatars/")
    );
  } catch {
    return false;
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const input = body as Record<string, unknown>;

  const fullName = text(input.full_name, 100);
  const avatarUrl = text(input.avatar_url, 2048);
  const bio = text(input.bio, 500);
  const location = text(input.location, 100);

  if (avatarUrl && !isAvatarStorageUrl(avatarUrl)) {
    return NextResponse.json(
      { error: "Profile photos must use the avatars storage bucket." },
      { status: 400 },
    );
  }

  /*
   * The database schema uses:
   *   name
   *   email
   *   avatar
   *
   * The UI/API uses:
   *   full_name
   *   avatar_url
   *
   * Therefore we translate the UI fields to the database fields here.
   */

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("id, name, email, avatar, bio, location")
    .eq("id", userId)
    .maybeSingle();

  if (currentProfileError) {
    return NextResponse.json(
      { error: "Unable to load your current profile." },
      { status: 500 },
    );
  }

  const { data: authData } = await supabase.auth.getUser();

  const email = currentProfile?.email ?? authData.user?.email ?? "";

  const name =
    fullName ||
    currentProfile?.name ||
    authData.user?.user_metadata?.name ||
    "RedNote User";

  if (!email) {
    return NextResponse.json(
      { error: "A valid account email is required." },
      { status: 400 },
    );
  }

  const values = {
    id: userId,
    email,
    name,
    avatar: avatarUrl || currentProfile?.avatar || null,
    bio,
    location,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(values, { onConflict: "id" })
    .select("id, name, email, avatar, bio, location")
    .single();

  if (error) {
    console.error("Profile update failed:", error);

    return NextResponse.json(
      {
        error:
          error.code === "23505"
            ? "That profile already exists."
            : "Unable to save profile.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    profile: {
      id: data.id,
      full_name: data.name,
      username: null,
      avatar_url: data.avatar,
      bio: data.bio,
      location: data.location,
    },
  });
}
