import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "completed" | "cancelled" | "failed";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);
}

const statusClasses: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800", paid: "bg-emerald-50 text-emerald-700", processing: "bg-blue-50 text-blue-700", shipped: "bg-violet-50 text-violet-700", completed: "bg-emerald-50 text-emerald-700", cancelled: "bg-neutral-100 text-neutral-600", failed: "bg-red-50 text-red-700", unpaid: "bg-neutral-100 text-neutral-600", refunded: "bg-violet-50 text-violet-700",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { admin } = await requireAdmin();
  const { id } = await params;

  const { data: order, error } = await admin.from("orders").select("id,buyer_id,status,payment_status,total_kes,reservation_expires_at,created_at,updated_at").eq("id", id).maybeSingle();
  if (error || !order) notFound();

  const [{ data: buyer }, { data: items }, { data: payment }] = await Promise.all([
    admin.from("profiles").select("id,name,email,location").eq("id", order.buyer_id).maybeSingle(),
    admin.from("order_items").select("id,product_id,seller_id,product_name,unit_price_kes,quantity,created_at").eq("order_id", id).order("created_at", { ascending: true }),
    admin.from("payments").select("id,provider,phone,amount_kes,status,merchant_request_id,checkout_request_id,result_code,result_description,mpesa_receipt,created_at,updated_at").eq("order_id", id).maybeSingle(),
  ]);

  const orderState = order.status as OrderStatus;
  const paymentState = order.payment_status as PaymentStatus;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-sm font-bold text-[#ff2442] hover:underline">← Back to orders</Link>

      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Order detail</p><h2 className="mt-1 break-all text-3xl font-black tracking-tight">{order.id}</h2><p className="mt-2 text-sm text-neutral-500">Created {formatDate(order.created_at)}</p></div>
        <div className="text-left sm:text-right"><p className="text-xs font-semibold text-neutral-500">Order total</p><p className="text-3xl font-black">{formatCurrency(Number(order.total_kes ?? 0))}</p></div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h3 className="font-black">Order status</h3><span className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-bold ${statusClasses[orderState]}`}>{orderState}</span><p className="mt-4 text-xs text-neutral-500">Last updated {formatDate(order.updated_at)}</p></section>
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h3 className="font-black">Payment status</h3><span className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-bold ${statusClasses[paymentState]}`}>{paymentState}</span>{order.reservation_expires_at ? <p className="mt-4 text-xs text-neutral-500">Reservation expires {formatDate(order.reservation_expires_at)}</p> : null}</section>
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h3 className="font-black">Buyer</h3><p className="mt-4 font-semibold">{buyer?.name || "Unknown buyer"}</p><p className="mt-1 text-sm text-neutral-500">{buyer?.email || order.buyer_id}</p>{buyer?.location ? <p className="mt-1 text-sm text-neutral-500">{buyer.location}</p> : null}</section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"><div className="border-b border-black/5 px-6 py-5"><h3 className="font-black">Order items</h3></div>{items?.length ? <div className="divide-y divide-black/5">{items.map((item) => <div key={item.id} className="flex flex-col justify-between gap-3 px-6 py-5 sm:flex-row sm:items-center"><div><p className="font-bold">{item.product_name}</p><p className="mt-1 text-sm text-neutral-500">{item.quantity} × {formatCurrency(Number(item.unit_price_kes ?? 0))}</p></div><p className="font-black">{formatCurrency(Number(item.unit_price_kes ?? 0) * item.quantity)}</p></div>)}</div> : <p className="px-6 py-10 text-sm text-neutral-500">No order items found.</p>}</section>

      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h3 className="font-black">M-Pesa payment</h3>{payment ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["Provider", payment.provider], ["Phone", payment.phone || "—"], ["Amount", formatCurrency(Number(payment.amount_kes ?? 0))], ["Payment status", payment.status], ["M-Pesa receipt", payment.mpesa_receipt || "—"], ["Result code", payment.result_code == null ? "—" : String(payment.result_code)], ["Checkout request", payment.checkout_request_id || "—"], ["Merchant request", payment.merchant_request_id || "—"], ["Result", payment.result_description || "—"]].map(([label, value]) => <div key={label} className="rounded-xl bg-neutral-50 p-4"><p className="text-xs font-semibold text-neutral-500">{label}</p><p className="mt-1 break-all text-sm font-bold">{value}</p></div>)}</div> : <p className="mt-4 text-sm text-neutral-500">No payment record exists for this order.</p>}</section>
    </div>
  );
}
