import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const expected = process.env.INTERNAL_CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!expected || authorization !== `Bearer ${expected}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("release_expired_reservations");
    if (error) {
      console.error("Reservation cleanup failed", error);
      return NextResponse.json({ error: "Unable to release reservations." }, { status: 500 });
    }
    return NextResponse.json({ releasedOrders: data ?? 0 });
  } catch (error) {
    console.error("Reservation cleanup configuration failed", error);
    return NextResponse.json({ error: "Reservation cleanup unavailable." }, { status: 503 });
  }
}
