import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "failed";

type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

const statusClasses: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  paid: "bg-emerald-50 text-emerald-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-violet-50 text-violet-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-neutral-100 text-neutral-600",
  failed: "bg-red-50 text-red-700",
};

const paymentClasses: Record<PaymentStatus, string> = {
  unpaid: "bg-neutral-100 text-neutral-600",
  pending: "bg-amber-50 text-amber-800",
  paid: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-violet-50 text-violet-700",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { admin } = await requireAdmin();
  const { id } = await params;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id,buyer_id,status,payment_status,total_kes,reservation_expires_at,created_at,updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (orderError || !order) {
    notFound();
  }

  const buyerId = order.buyer_id ?? null;

  const [{ data: buyer }, { data: items }, { data: payment }] =
    await Promise.all([
      buyerId
        ? admin
            .from("profiles")
            .select("id,name,email,location")
            .eq("id", buyerId)
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      admin
        .from("order_items")
        .select(
          "id,product_id,seller_id,product_name,unit_price_kes,quantity,created_at",
        )
        .eq("order_id", id)
        .order("created_at", {
          ascending: true,
        }),

      admin
        .from("payments")
        .select(
          "id,provider,phone,amount_kes,status,merchant_request_id,checkout_request_id,result_code,result_description,mpesa_receipt,created_at,updated_at",
        )
        .eq("order_id", id)
        .maybeSingle(),
    ]);

  const orderState = order.status as OrderStatus;
  const paymentState = order.payment_status as PaymentStatus;

  const createdAt = order.created_at ?? new Date().toISOString();

  const updatedAt = order.updated_at ?? createdAt;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/admin/orders"
          className="text-sm font-bold text-[#ff2442] hover:underline"
        >
          ← Back to orders
        </Link>
      </div>

      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">
            Order detail
          </p>

          <h2 className="mt-1 break-all text-3xl font-black tracking-tight">
            {order.id}
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Created {formatDate(createdAt)}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold text-neutral-500">Order total</p>

          <p className="text-3xl font-black">
            {formatCurrency(Number(order.total_kes ?? 0))}
          </p>
        </div>
      </section>

      {/* Status cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Order status */}
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h3 className="font-black">Order status</h3>

          <span
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-bold ${
              statusClasses[orderState]
            }`}
          >
            {orderState}
          </span>

          <p className="mt-4 text-xs text-neutral-500">
            Last updated {formatDate(updatedAt)}
          </p>
        </section>

        {/* Payment status */}
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h3 className="font-black">Payment status</h3>

          <span
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-bold ${
              paymentClasses[paymentState]
            }`}
          >
            {paymentState}
          </span>

          {order.reservation_expires_at ? (
            <p className="mt-4 text-xs text-neutral-500">
              Reservation expires {formatDate(order.reservation_expires_at)}
            </p>
          ) : null}
        </section>

        {/* Buyer */}
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h3 className="font-black">Buyer</h3>

          <p className="mt-4 font-semibold">{buyer?.name || "Unknown buyer"}</p>

          <p className="mt-1 break-all text-sm text-neutral-500">
            {buyer?.email || buyerId || "No buyer ID"}
          </p>

          {buyer?.location ? (
            <p className="mt-1 text-sm text-neutral-500">{buyer.location}</p>
          ) : null}
        </section>
      </div>

      {/* Order items */}
      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-6 py-5">
          <h3 className="font-black">Order items</h3>
        </div>

        {items && items.length > 0 ? (
          <div className="divide-y divide-black/5">
            {items.map((item) => {
              const itemTotal =
                Number(item.unit_price_kes ?? 0) * Number(item.quantity ?? 0);

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 px-6 py-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-bold">{item.product_name}</p>

                    <p className="mt-1 text-sm text-neutral-500">
                      {item.quantity} ×{" "}
                      {formatCurrency(Number(item.unit_price_kes ?? 0))}
                    </p>

                    {item.product_id ? (
                      <p className="mt-1 break-all text-xs text-neutral-400">
                        Product: {item.product_id}
                      </p>
                    ) : null}

                    {item.seller_id ? (
                      <p className="mt-1 break-all text-xs text-neutral-400">
                        Seller: {item.seller_id}
                      </p>
                    ) : null}
                  </div>

                  <p className="font-black">{formatCurrency(itemTotal)}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-6 py-10 text-sm text-neutral-500">
            No order items found.
          </p>
        )}
      </section>

      {/* Payment details */}
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-black">M-Pesa payment</h3>

        {payment ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold text-neutral-500">Provider</p>

              <p className="mt-1 text-sm font-bold">{payment.provider}</p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold text-neutral-500">Phone</p>

              <p className="mt-1 text-sm font-bold">{payment.phone || "—"}</p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold text-neutral-500">Amount</p>

              <p className="mt-1 text-sm font-bold">
                {formatCurrency(Number(payment.amount_kes ?? 0))}
              </p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold text-neutral-500">
                Payment status
              </p>

              <p className="mt-1 text-sm font-bold">{payment.status}</p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold text-neutral-500">
                M-Pesa receipt
              </p>

              <p className="mt-1 break-all text-sm font-bold">
                {payment.mpesa_receipt || "—"}
              </p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold text-neutral-500">
                Result code
              </p>

              <p className="mt-1 text-sm font-bold">
                {payment.result_code == null
                  ? "—"
                  : String(payment.result_code)}
              </p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold text-neutral-500">
                Checkout request
              </p>

              <p className="mt-1 break-all text-sm font-bold">
                {payment.checkout_request_id || "—"}
              </p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold text-neutral-500">
                Merchant request
              </p>

              <p className="mt-1 break-all text-sm font-bold">
                {payment.merchant_request_id || "—"}
              </p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-semibold text-neutral-500">
                Result description
              </p>

              <p className="mt-1 text-sm font-bold">
                {payment.result_description || "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">
            No payment record exists for this order.
          </p>
        )}
      </section>

      {/* Metadata */}
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-black">Order metadata</h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-neutral-500">Order ID</p>

            <p className="mt-1 break-all text-sm font-bold">{order.id}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-500">Buyer ID</p>

            <p className="mt-1 break-all text-sm font-bold">{buyerId || "—"}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-500">Created</p>

            <p className="mt-1 text-sm font-bold">{formatDate(createdAt)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-500">Updated</p>

            <p className="mt-1 text-sm font-bold">{formatDate(updatedAt)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
