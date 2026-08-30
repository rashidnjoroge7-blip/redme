import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const expected = process.env.INTERNAL_CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!expected || authorization !== `Bearer ${expected}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("release_expired_reservations");
  if (error) return NextResponse.json({ error: "Unable to release reservations." }, { status: 500 });
  return NextResponse.json({ releasedOrders: data ?? 0 });
}
