import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { orderId } = await params;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data, error } = await supabase.from("orders").update({ status: "cancelled", payment_status: "failed", updated_at: new Date().toISOString() }).eq("id", orderId).eq("buyer_id", userId).eq("status", "pending").eq("payment_status", "unpaid").select("id, status, payment_status").maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to cancel order." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Only unpaid pending orders can be cancelled." }, { status: 409 });
  return NextResponse.json({ order: data });
}
