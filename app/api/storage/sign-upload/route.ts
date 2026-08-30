import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const CONFIG: Record<string, { maxBytes: number; types: string[] }> = {
  avatars: { maxBytes: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  "post-media": { maxBytes: 10 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  "product-media": { maxBytes: 10 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const input = body as Record<string, unknown>;
  const bucket = typeof input.bucket === "string" ? input.bucket : "";
  const fileName = typeof input.fileName === "string" ? input.fileName : "";
  const contentType = typeof input.contentType === "string" ? input.contentType.toLowerCase() : "";
  const size = Number(input.size);
  const config = CONFIG[bucket];

  if (!config || !fileName || !config.types.includes(contentType) || !Number.isInteger(size) || size < 1 || size > config.maxBytes) {
    return NextResponse.json({ error: "Unsupported media, file type or size." }, { status: 400 });
  }

  const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: "Unable to create upload URL." }, { status: 500 });

  return NextResponse.json({ bucket, path, token: data.token });
}
