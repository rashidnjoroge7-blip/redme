import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: "⌂" },
  { href: "/admin/users", label: "Users", icon: "◉" },
  { href: "/admin/posts", label: "Posts", icon: "▤" },
  { href: "/admin/reports", label: "Reports", icon: "⚑" },
  { href: "/admin/products", label: "Products", icon: "◇" },
  { href: "/admin/orders", label: "Orders", icon: "□" },
  { href: "/admin/payments", label: "Payments", icon: "₵" },
  { href: "/admin/notifications", label: "Notifications", icon: "♢" },
  { href: "/admin/system", label: "System", icon: "◌" },
];

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-neutral-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-black/5 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-black/5 px-6 py-5">
            <Link href="/" className="text-xl font-black text-[#ff2442]">
              RedNote <span className="font-medium text-neutral-800">Admin</span>
            </Link>
            <p className="mt-1 text-xs text-neutral-500">Nairobi platform control center</p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Admin navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
              >
                <span className="w-5 text-center text-neutral-400" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-black/5 p-4">
            <p className="truncate text-xs font-semibold text-neutral-700">{user.email ?? "Admin account"}</p>
            <Link href="/" className="mt-2 block text-xs font-medium text-[#ff2442] hover:underline">
              ← Back to RedNote
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff2442]">Administration</p>
              <h1 className="text-lg font-black">RedNote Control Center</h1>
            </div>
            <Link href="/" className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-neutral-50">
              View site
            </Link>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-black/5 bg-white px-4 py-2 lg:hidden" aria-label="Admin navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700">
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
