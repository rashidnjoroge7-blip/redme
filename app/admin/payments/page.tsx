import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

type PaymentStatus = "pending" | "paid" | "failed";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);
}

const statusClasses: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  paid: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const { admin } = await requireAdmin();
  const params = await searchParams;
  const requestedStatus = params.status;
  const status = ["pending", "paid", "failed"].includes(requestedStatus ?? "") ? (requestedStatus as PaymentStatus) : "";
  const q = (params.q ?? "").trim();
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  let builder = admin.from("payments").select("id,order_id,phone,amount_kes,status,merchant_request_id,checkout_request_id,result_code,result_description,mpesa_receipt,created_at,updated_at", { count: "exact" }).order("created_at", { ascending: false });
  if (status) builder = builder.eq("status", status);
  if (q) builder = builder.or(`order_id.ilike.%${q}%,checkout_request_id.ilike.%${q}%,mpesa_receipt.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data, count, error } = await builder.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const payments = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const makeHref = (nextPage: number) => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (q) query.set("q", q);
    query.set("page", String(nextPage));
    return `/admin/payments?${query.toString()}`;
  };

  return (
    <div className="space-y-6">
      <section><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Payments</p><div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-3xl font-black tracking-tight">Payment monitoring</h2><p className="mt-2 text-sm text-neutral-600">Track M-Pesa payment state and reconciliation identifiers.</p></div><div className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm"><p className="text-xs font-semibold text-neutral-500">Payment records</p><p className="mt-1 text-xl font-black">{total.toLocaleString("en-KE")}</p></div></div></section>

      <form className="grid gap-3 rounded-2xl border border-black/5 bg-white p-4 sm:grid-cols-[1fr_auto_auto]"><input name="q" defaultValue={q} placeholder="Order ID, receipt, phone or checkout ID…" className="rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#ff2442]" /><select name="status" defaultValue={status} className="rounded-xl border border-black/10 px-4 py-3 text-sm"><option value="">All payment statuses</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option></select><button type="submit" className="rounded-xl bg-[#ff2442] px-5 py-3 text-sm font-bold text-white">Filter</button></form>

      {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">Unable to load payments: {error.message}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">{payments.length === 0 && !error ? <div className="px-5 py-12 text-center text-sm text-neutral-500">No payments match the selected filters.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="border-b border-black/5 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Phone</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Receipt</th><th className="px-5 py-4">Result</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Action</th></tr></thead><tbody className="divide-y divide-black/5">{payments.map((payment) => { const state = payment.status as PaymentStatus; return <tr key={payment.id}><td className="px-5 py-4"><Link href={`/admin/orders/${payment.order_id}`} className="font-bold text-[#ff2442] hover:underline">{payment.order_id.slice(0, 8)}…</Link></td><td className="px-5 py-4 text-neutral-600">{payment.phone || "—"}</td><td className="px-5 py-4 font-bold">{formatCurrency(Number(payment.amount_kes ?? 0))}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses[state]}`}>{state}</span></td><td className="px-5 py-4 font-semibold">{payment.mpesa_receipt || "—"}</td><td className="max-w-[220px] px-5 py-4"><p className="truncate font-semibold">{payment.result_description || "—"}</p>{payment.result_code != null ? <p className="mt-1 text-xs text-neutral-400">Code {payment.result_code}</p> : null}</td><td className="px-5 py-4 text-neutral-500">{formatDate(payment.created_at)}</td><td className="px-5 py-4"><Link href={`/admin/orders/${payment.order_id}`} className="font-bold text-[#ff2442] hover:underline">Order →</Link></td></tr>; })}</tbody></table></div>}</div>

      <div className="flex items-center justify-between text-sm"><span className="text-neutral-500">Page {safePage} of {totalPages}</span><div className="flex gap-2">{safePage > 1 ? <Link href={makeHref(safePage - 1)} className="rounded-xl border border-black/10 bg-white px-4 py-2 font-semibold">← Previous</Link> : null}{safePage < totalPages ? <Link href={makeHref(safePage + 1)} className="rounded-xl border border-black/10 bg-white px-4 py-2 font-semibold">Next →</Link> : null}</div></div>
    </div>
  );
}
