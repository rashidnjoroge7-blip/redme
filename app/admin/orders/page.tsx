import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "completed" | "cancelled" | "failed";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);
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

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; payment?: string; q?: string; page?: string }> }) {
  const { admin } = await requireAdmin();
  const params = await searchParams;
  const requestedStatus = params.status;
  const status = ["pending", "paid", "processing", "shipped", "completed", "cancelled", "failed"].includes(requestedStatus ?? "")
    ? (requestedStatus as OrderStatus)
    : "";
  const requestedPayment = params.payment;
  const payment = ["unpaid", "pending", "paid", "failed", "refunded"].includes(requestedPayment ?? "")
    ? (requestedPayment as PaymentStatus)
    : "";
  const q = (params.q ?? "").trim();
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  let builder = admin
    .from("orders")
    .select("id,buyer_id,status,payment_status,total_kes,created_at,updated_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) builder = builder.eq("status", status);
  if (payment) builder = builder.eq("payment_status", payment);
  if (q) builder = builder.ilike("id", `%${q}%`);

  const { data, count, error } = await builder.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const orders = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const buyerIds = [...new Set(orders.map((order) => order.buyer_id))];
  const { data: buyers } = buyerIds.length
    ? await admin.from("profiles").select("id,name,email").in("id", buyerIds)
    : { data: [] };
  const buyerMap = new Map((buyers ?? []).map((buyer) => [buyer.id, buyer]));

  const makeHref = (nextPage: number) => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (payment) query.set("payment", payment);
    if (q) query.set("q", q);
    query.set("page", String(nextPage));
    return `/admin/orders?${query.toString()}`;
  };

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Marketplace</p>
        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Orders</h2>
            <p className="mt-2 text-sm text-neutral-600">Monitor order lifecycle and payment state.</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold text-neutral-500">Total orders</p>
            <p className="mt-1 text-xl font-black">{total.toLocaleString("en-KE")}</p>
          </div>
        </div>
      </section>

      <form className="grid gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <input name="q" defaultValue={q} placeholder="Search order ID…" className="rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#ff2442]" />
        <select name="status" defaultValue={status} className="rounded-xl border border-black/10 px-4 py-3 text-sm">
          <option value="">All order statuses</option>
          <option value="pending">Pending</option><option value="paid">Paid</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="failed">Failed</option>
        </select>
        <select name="payment" defaultValue={payment} className="rounded-xl border border-black/10 px-4 py-3 text-sm">
          <option value="">All payment statuses</option>
          <option value="unpaid">Unpaid</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
        </select>
        <button type="submit" className="rounded-xl bg-[#ff2442] px-4 py-3 text-sm font-bold text-white">Filter orders</button>
      </form>

      {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">Unable to load orders: {error.message}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        {orders.length === 0 && !error ? (
          <div className="px-5 py-12 text-center text-sm text-neutral-500">No orders match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-black/5 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Buyer</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Order status</th><th className="px-5 py-4">Payment</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map((order) => {
                  const buyer = buyerMap.get(order.buyer_id);
                  const orderState = order.status as OrderStatus;
                  const paymentState = order.payment_status as PaymentStatus;
                  return (
                    <tr key={order.id} className="align-top">
                      <td className="px-5 py-4"><p className="font-bold">{order.id.slice(0, 8)}…</p><p className="mt-1 text-xs text-neutral-400">{order.id}</p></td>
                      <td className="px-5 py-4"><p className="font-semibold">{buyer?.name || "Unknown buyer"}</p><p className="mt-1 text-xs text-neutral-500">{buyer?.email || order.buyer_id}</p></td>
                      <td className="px-5 py-4 font-bold">{formatCurrency(Number(order.total_kes ?? 0))}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses[orderState]}`}>{orderState}</span></td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${paymentClasses[paymentState]}`}>{paymentState}</span></td>
                      <td className="px-5 py-4 text-neutral-500">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-4"><Link href={`/admin/orders/${order.id}`} className="font-bold text-[#ff2442] hover:underline">View →</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-500">Page {safePage} of {totalPages}</span>
        <div className="flex gap-2">
          {safePage > 1 ? <Link href={makeHref(safePage - 1)} className="rounded-xl border border-black/10 bg-white px-4 py-2 font-semibold">← Previous</Link> : null}
          {safePage < totalPages ? <Link href={makeHref(safePage + 1)} className="rounded-xl border border-black/10 bg-white px-4 py-2 font-semibold">Next →</Link> : null}
        </div>
      </div>
    </div>
  );
}
