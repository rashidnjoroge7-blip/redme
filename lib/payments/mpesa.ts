const DARAJA_BASE = process.env.MPESA_ENV === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function timestamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

export async function getDarajaToken() {
  const credentials = Buffer.from(`${required("MPESA_CONSUMER_KEY")}:${required("MPESA_CONSUMER_SECRET")}`).toString("base64");
  const response = await fetch(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }, cache: "no-store",
  });
  if (!response.ok) throw new Error(`Daraja OAuth failed (${response.status})`);
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Daraja did not return an access token");
  return data.access_token;
}

export async function initiateStkPush(input: { amount: number; phone: string; accountReference: string; description: string; callbackUrl: string }) {
  const token = await getDarajaToken();
  const shortcode = required("MPESA_SHORTCODE");
  const passkey = required("MPESA_PASSKEY");
  const time = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${time}`).toString("base64");

  const response = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: time,
      TransactionType: process.env.MPESA_TRANSACTION_TYPE ?? "CustomerPayBillOnline",
      Amount: Math.max(1, Math.round(input.amount)),
      PartyA: input.phone,
      PartyB: shortcode,
      PhoneNumber: input.phone,
      CallBackURL: input.callbackUrl,
      AccountReference: input.accountReference.slice(0, 12),
      TransactionDesc: input.description.slice(0, 13),
    }),
    cache: "no-store",
  });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok || data.ResponseCode !== "0") throw new Error(String(data.errorMessage ?? data.ResponseDescription ?? `Daraja STK Push failed (${response.status})`));
  return data as { MerchantRequestID?: string; CheckoutRequestID?: string; ResponseCode?: string; ResponseDescription?: string; CustomerMessage?: string };
}
