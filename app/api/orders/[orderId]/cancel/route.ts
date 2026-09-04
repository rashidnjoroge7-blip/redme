import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { orderId } = await params;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const rpc = supabase.rpc as unknown as (
    functionName: "cancel_order",
    args: { p_order_id: string },
  ) => Promise<{
    data: {
      id: string;
      status: string;
      payment_status: string;
    } | null;
    error: { message: string } | null;
  }>;

  const { data, error } = await rpc("cancel_order", {
    p_order_id: orderId,
  });

  if (error) {
    if (error.message.includes("ORDER_NOT_FOUND")) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 },
      );
    }

    if (error.message.includes("FORBIDDEN")) {
      return NextResponse.json(
        { error: "You cannot cancel this order." },
        { status: 403 },
      );
    }

    if (error.message.includes("ORDER_NOT_CANCELLABLE")) {
      return NextResponse.json(
        { error: "Only unpaid pending orders can be cancelled." },
        { status: 409 },
      );
    }

    if (error.message.includes("AUTH_REQUIRED")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    console.error("cancel_order RPC failed:", error);

    return NextResponse.json(
      { error: "Unable to cancel order." },
      { status: 500 },
    );
  }

  return NextResponse.json({ order: data });
}
