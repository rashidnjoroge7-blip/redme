import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { orderId } = await params;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: order, error } = await supabase.from("orders").select("id, buyer_id, status, payment_status, total_kes, created_at, updated_at").eq("id", orderId).eq("buyer_id", userId).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to load order." }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const { data: items } = await supabase.from("order_items").select("id, product_id, seller_id, product_name, unit_price_kes, quantity").eq("order_id", orderId);
  return NextResponse.json({ order, items: items ?? [] });
}
