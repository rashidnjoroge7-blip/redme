import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const notificationId = body && typeof body === "object" && typeof (body as Record<string, unknown>).notificationId === "string"
    ? (body as Record<string, unknown>).notificationId
    : "";

  if (!notificationId) return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", userId);

  if (error) return NextResponse.json({ error: "Unable to mark notification as read." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
