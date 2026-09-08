import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

const cards = [
  { key: "users", label: "Total users", href: "/admin/users", icon: "◉" },
  { key: "posts", label: "Posts", href: "/admin/posts", icon: "▤" },
  { key: "products", label: "Products", href: "/admin/products", icon: "◇" },
  { key: "orders", label: "Orders", href: "/admin/orders", icon: "□" },
  { key: "payments", label: "Paid orders", href: "/admin/payments", icon: "₵" },
  { key: "notifications", label: "Notifications", href: "/admin/notifications", icon: "♢" },
] as const;

export default async function AdminDashboardPage() {
  const { admin } = await requireAdmin();

  const [users, posts, products, orders, paidOrders, notifications, paidRevenue] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("posts").select("id", { count: "exact", head: true }),
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
    admin.from("notifications").select("id", { count: "exact", head: true }),
    admin.from("orders").select("total_kes").eq("payment_status", "paid"),
  ]);

  const stats = {
    users: users.count ?? 0,
    posts: posts.count ?? 0,
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    payments: paidOrders.count ?? 0,
    notifications: notifications.count ?? 0,
  };

  const revenue = (paidRevenue.data ?? []).reduce(
    (sum, order) => sum + Number(order.total_kes ?? 0),
    0,
  );

  const queryErrors = [users, posts, products, orders, paidOrders, notifications, paidRevenue]
    .filter((result) => result.error)
    .map((result) => result.error?.message);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Overview</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight">Good to see you.</h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              Monitor the RedNote community, marketplace and platform activity from one place.
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold text-neutral-500">Paid marketplace revenue</p>
            <p className="mt-1 text-xl font-black">{formatCurrency(revenue)}</p>
          </div>
        </div>
      </section>

      {queryErrors.length > 0 && (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Some dashboard metrics could not be loaded. The remaining metrics are still shown.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f2] text-lg font-bold text-[#ff2442]" aria-hidden="true">
                {card.icon}
              </span>
              <span className="text-xs font-bold text-neutral-400 transition group-hover:text-[#ff2442]">Open →</span>
            </div>
            <p className="mt-5 text-sm font-semibold text-neutral-500">{card.label}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">{formatNumber(stats[card.key])}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black">Platform health</h3>
              <p className="mt-1 text-sm text-neutral-500">Stage 1 security and infrastructure checks.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Protected</span>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            {[
              ["Authentication", "Supabase Auth"],
              ["Admin authorization", "Server-side role check"],
              ["Admin data access", "Service-role after authorization"],
              ["Payment callbacks", "Secret-protected endpoint"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-black/5 pb-3 last:border-0 last:pb-0">
                <span className="text-neutral-500">{label}</span>
                <span className="text-right font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h3 className="font-black">Quick actions</h3>
          <p className="mt-1 text-sm text-neutral-500">Management modules will be enabled in the next stages.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Manage users", "/admin/users"],
              ["Review posts", "/admin/posts"],
              ["Review reports", "/admin/reports"],
              ["Manage orders", "/admin/orders"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="rounded-xl border border-black/10 px-4 py-3 text-sm font-bold transition hover:border-[#ff2442] hover:text-[#ff2442]">
                {label} →
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
