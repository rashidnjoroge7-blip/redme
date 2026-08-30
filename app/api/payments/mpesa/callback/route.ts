import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payload" }, { status: 400 }); }
  const callback = (payload as Record<string, any>)?.Body?.stkCallback;
  const checkoutRequestId = typeof callback?.CheckoutRequestID === "string" ? callback.CheckoutRequestID : "";
  const resultCode = Number(callback?.ResultCode);
  if (!checkoutRequestId || !Number.isInteger(resultCode)) return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid callback" }, { status: 400 });

  const supabase = await createClient();
  const { data: payment } = await supabase.from("payments").select("id, order_id, amount_kes, phone, status").eq("checkout_request_id", checkoutRequestId).maybeSingle();
  if (!payment) return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  if (payment.status === "paid") return NextResponse.json({ ResultCode: 0, ResultDesc: "Already processed" });

  const items = Array.isArray(callback?.CallbackMetadata?.Item) ? callback.CallbackMetadata.Item : [];
  const getValue = (name: string) => items.find((item: any) => item?.Name === name)?.Value;
  const receipt = getValue("MpesaReceiptNumber");
  const callbackAmount = Number(getValue("Amount"));
  const callbackPhone = String(getValue("PhoneNumber") ?? "");
  const expectedPhone = payment.phone.replace(/\D/g, "");
  const amountMatches = Number.isFinite(callbackAmount) && callbackAmount === Number(payment.amount_kes);
  const phoneMatches = !callbackPhone || callbackPhone === expectedPhone;

  if (resultCode === 0 && amountMatches && phoneMatches && receipt) {
    const { error } = await supabase.from("payments").update({ status: "paid", result_code: resultCode, result_description: String(callback?.ResultDesc ?? "Success"), mpesa_receipt: String(receipt), updated_at: new Date().toISOString() }).eq("id", payment.id).eq("status", "pending");
    if (!error) await supabase.from("orders").update({ status: "processing", payment_status: "paid", updated_at: new Date().toISOString() }).eq("id", payment.order_id).eq("payment_status", "unpaid");
  } else if (resultCode !== 0) {
    await supabase.from("payments").update({ status: "failed", result_code: resultCode, result_description: String(callback?.ResultDesc ?? "Payment failed"), updated_at: new Date().toISOString() }).eq("id", payment.id).neq("status", "paid");
    await supabase.from("orders").update({ status: "failed", payment_status: "failed", updated_at: new Date().toISOString() }).eq("id", payment.order_id).eq("payment_status", "unpaid");
  } else {
    await supabase.from("payments").update({ result_code: resultCode, result_description: "Callback validation failed", updated_at: new Date().toISOString() }).eq("id", payment.id).eq("status", "pending");
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
