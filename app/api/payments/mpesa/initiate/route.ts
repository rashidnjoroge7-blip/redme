import { createClient } from "@/lib/supabase/server";
import { initiateStkPush } from "@/lib/payments/mpesa";
import { NextResponse } from "next/server";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^2547\d{8}$/.test(digits)) return digits;
  if (/^07\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^7\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const orderId = typeof input.orderId === "string" ? input.orderId : "";
  const phone =
    typeof input.phone === "string" ? normalizePhone(input.phone) : null;
  if (!orderId || !phone)
    return NextResponse.json(
      { error: "Valid order and Kenyan M-Pesa phone number are required." },
      { status: 400 },
    );

  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, total_kes, status, payment_status")
    .eq("id", orderId)
    .eq("buyer_id", userId)
    .maybeSingle();
  if (!order)
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "pending" || order.payment_status !== "unpaid")
    return NextResponse.json(
      { error: "This order is not available for payment." },
      { status: 409 },
    );
  if (order.total_kes == null || order.total_kes <= 0) {
    return NextResponse.json(
      { error: "Invalid order total." },
      { status: 400 },
    );
  }

  if (
    !process.env.MPESA_CONSUMER_KEY ||
    !process.env.MPESA_CONSUMER_SECRET ||
    !process.env.MPESA_PASSKEY ||
    !process.env.MPESA_SHORTCODE ||
    !process.env.MPESA_CALLBACK_URL
  ) {
    return NextResponse.json(
      { error: "M-Pesa is not configured on the server yet." },
      { status: 503 },
    );
  }

  const { data: payment, error } = await supabase
    .from("payments")
    .upsert(
      {
        order_id: order.id,
        provider: "mpesa",
        phone,
        amount_kes: order.total_kes,
        status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "order_id" },
    )
    .select("id, order_id, amount_kes, phone, status")
    .single();
  if (error || !payment)
    return NextResponse.json(
      { error: "Unable to initialize payment." },
      { status: 500 },
    );

  try {
    const response = await initiateStkPush({
      amount: Number(order.total_kes),
      phone,
      accountReference: `RN${order.id.replace(/-/g, "").slice(0, 10)}`,
      description: "RedNote order",
      callbackUrl: process.env.MPESA_CALLBACK_URL,
    });
    const checkoutRequestId = response.CheckoutRequestID;
    if (!checkoutRequestId)
      throw new Error("Daraja did not return CheckoutRequestID");
    await supabase
      .from("payments")
      .update({
        merchant_request_id: response.MerchantRequestID ?? null,
        checkout_request_id: checkoutRequestId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);
    return NextResponse.json(
      {
        payment: { ...payment, checkout_request_id: checkoutRequestId },
        message:
          response.CustomerMessage ??
          "STK Push sent. Check your phone to complete payment.",
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("M-Pesa STK Push failed", error);
    await supabase
      .from("payments")
      .update({
        status: "failed",
        result_description: "STK Push initiation failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .neq("status", "paid");
    return NextResponse.json(
      { error: "Unable to initiate M-Pesa payment." },
      { status: 502 },
    );
  }
}
