import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: orderId, error } = await supabase.rpc("checkout_cart");
  if (error) {
    const message = error.message.includes("OUT_OF_STOCK") ? "One or more products are out of stock." : error.message.includes("EMPTY_CART") ? "Your cart is empty." : "Unable to create checkout order.";
    return NextResponse.json({ error: message }, { status: error.message.includes("OUT_OF_STOCK") ? 409 : 400 });
  }

  return NextResponse.json({ orderId }, { status: 201 });
}
