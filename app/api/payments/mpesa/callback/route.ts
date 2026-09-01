import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CallbackItem = {
  Name?: string;
  Value?: string | number | null;
};

type StkCallback = {
  CheckoutRequestID?: unknown;
  ResultCode?: unknown;
  ResultDesc?: unknown;
  CallbackMetadata?: {
    Item?: CallbackItem[];
  };
};

type MpesaCallbackPayload = {
  Body?: {
    stkCallback?: StkCallback;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "Invalid payload" },
      { status: 400 },
    );
  }

  const root = isRecord(payload) ? (payload as MpesaCallbackPayload) : {};

  const callback = root.Body?.stkCallback;

  if (!callback) {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "Invalid callback" },
      { status: 400 },
    );
  }

  const checkoutRequestId =
    typeof callback.CheckoutRequestID === "string"
      ? callback.CheckoutRequestID
      : "";

  const resultCode = Number(callback.ResultCode);

  if (!checkoutRequestId || !Number.isInteger(resultCode)) {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "Invalid callback" },
      { status: 400 },
    );
  }

  const items = callback.CallbackMetadata?.Item ?? [];

  const getValue = (name: string): string | number | null | undefined =>
    items.find((item) => item.Name === name)?.Value;

  const receiptValue = getValue("MpesaReceiptNumber");
  const amountValue = getValue("Amount");
  const phoneValue = getValue("PhoneNumber");

  const receipt =
    resultCode === 0 && receiptValue != null ? String(receiptValue) : "";

  const amount =
    resultCode === 0 && amountValue != null ? Number(amountValue) : 0;

  const phone =
    resultCode === 0 && phoneValue != null ? String(phoneValue) : "";

  if (resultCode === 0) {
    if (!receipt || !Number.isFinite(amount) || amount <= 0 || !phone) {
      return NextResponse.json(
        {
          ResultCode: 1,
          ResultDesc: "Invalid successful payment metadata",
        },
        { status: 400 },
      );
    }
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("reconcile_mpesa_payment", {
      p_checkout_request_id: checkoutRequestId,
      p_result_code: resultCode,
      p_result_description: String(callback.ResultDesc ?? ""),
      p_receipt: receipt,
      p_callback_amount: Number.isFinite(amount) ? amount : 0,
      p_callback_phone: phone,
    });

    if (error) {
      console.error("M-Pesa reconciliation failed", error);

      return NextResponse.json(
        {
          ResultCode: 1,
          ResultDesc: "Reconciliation failed",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: String(data ?? "Accepted"),
    });
  } catch (error) {
    console.error("M-Pesa callback processing failed", error);

    return NextResponse.json(
      {
        ResultCode: 1,
        ResultDesc: "Callback processing failed",
      },
      { status: 500 },
    );
  }
}
