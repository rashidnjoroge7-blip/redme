import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let payload: any;
  try { payload = await request.json(); } catch { return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payload" }, { status: 400 }); }

  const callback = payload?.Body?.stkCallback;
  const checkoutRequestId = callback?.CheckoutRequestID;
  const resultCode = Number(callback?.ResultCode);
  if (!checkoutRequestId || !Number.isInteger(resultCode)) return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid callback" }, { status: 400 });

  const supabase = await createClient();
  const { data: payment } = await supabase.from("payments").select("id, order_id, status").eq("checkout_request_id", checkoutRequestId).maybeSingle();
  if (!payment) return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

  // Idempotency: a completed payment is never moved backwards by a duplicate callback.
  if (payment.status === "paid") return NextResponse.json({ ResultCode: 0, ResultDesc: "Already processed" });

  const metadata = callback?.CallbackMetadata?.Item ?? [];
  const receipt = metadata.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value;

  if (resultCode === 0) {
    const { error } = await supabase.from("payments").update({ status: "paid", result_code: resultCode, result_description: String(callback?.ResultDesc ?? "Success"), mpesa_receipt: receipt ? String(receipt) : null, updated_at: new Date().toISOString() }).eq("id", payment.id).neq("status", "paid");
    if (!error) await supabase.from("orders").update({ status: "processing", payment_status: "paid", updated_at: new Date().toISOString() }).eq("id", payment.order_id).eq("payment_status", "unpaid");
  } else {
    await supabase.from("payments").update({ status: "failed", result_code: resultCode, result_description: String(callback?.ResultDesc ?? "Payment failed"), updated_at: new Date().toISOString() }).eq("id", payment.id).neq("status", "paid");
    await supabase.from("orders").update({ status: "failed", payment_status: "failed", updated_at: new Date().toISOString() }).eq("id", payment.order_id).eq("payment_status", "unpaid");
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
