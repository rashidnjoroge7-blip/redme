import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payload" }, { status: 400 }); }

  const callback = (payload as Record<string, any>)?.Body?.stkCallback;
  const checkoutRequestId = typeof callback?.CheckoutRequestID === "string" ? callback.CheckoutRequestID : "";
  const resultCode = Number(callback?.ResultCode);
  if (!checkoutRequestId || !Number.isInteger(resultCode)) return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid callback" }, { status: 400 });

  const items = Array.isArray(callback?.CallbackMetadata?.Item) ? callback.CallbackMetadata.Item : [];
  const getValue = (name: string) => items.find((item: any) => item?.Name === name)?.Value;
  const receipt = getValue("MpesaReceiptNumber");
  const amount = resultCode === 0 ? Number(getValue("Amount")) : null;
  const phone = resultCode === 0 && getValue("PhoneNumber") != null ? String(getValue("PhoneNumber")) : null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("reconcile_mpesa_payment", {
      p_checkout_request_id: checkoutRequestId,
      p_result_code: resultCode,
      p_result_description: String(callback?.ResultDesc ?? ""),
      p_receipt: receipt ? String(receipt) : null,
      p_callback_amount: Number.isFinite(amount) ? amount : null,
      p_callback_phone: phone,
    });
    if (error) {
      console.error("M-Pesa reconciliation failed", error);
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Reconciliation failed" }, { status: 500 });
    }
    return NextResponse.json({ ResultCode: 0, ResultDesc: String(data ?? "Accepted") });
  } catch (error) {
    console.error("M-Pesa callback processing failed", error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Callback processing failed" }, { status: 500 });
  }
}
