import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function roleLabel(role: string | null) {
  return role ? role.replaceAll("_", " ") : "user";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { admin } = await requireAdmin();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  let builder = admin
    .from("profiles")
    .select("id,name,email,role,status,location,created_at,updated_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (query) {
    const escaped = query.replaceAll(",", "");
    builder = builder.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: users, count, error } = await builder.range(from, to);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const makePageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextPage > 1) params.set("page", String(nextPage));
    const value = params.toString();
    return value ? `/admin/users?${value}` : "/admin/users";
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link href="/admin" className="text-sm font-bold text-[#ff2442]">← Admin Dashboard</Link>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Administration</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Users</h1>
          <p className="mt-2 text-sm text-neutral-600">Search and review RedNote accounts.</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-neutral-500">Total accounts</p>
          <p className="mt-1 text-xl font-black">{total.toLocaleString("en-KE")}</p>
        </div>
      </header>

      <form className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm" method="get">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name or email…"
            aria-label="Search users"
            className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff2442]"
          />
          <button type="submit" className="rounded-xl bg-[#ff2442] px-5 py-3 text-sm font-bold text-white">Search</button>
          {query ? <Link href="/admin/users" className="rounded-xl border border-black/10 px-5 py-3 text-center text-sm font-bold">Clear</Link> : null}
        </div>
      </form>

      {error ? (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Users could not be loaded. Check the profiles schema and administrator database access.
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-black/5 bg-neutral-50">
              <tr>
                <th className="px-5 py-4 font-bold">User</th>
                <th className="px-5 py-4 font-bold">Role</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold">Location</th>
                <th className="px-5 py-4 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((user) => (
                <tr key={user.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-4">
                    <p className="font-bold text-[#1a1a1a]">{user.name || "Unnamed user"}</p>
                    <p className="mt-1 text-xs text-neutral-500">{user.email || "No email"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#fff0f2] px-3 py-1 text-xs font-bold capitalize text-[#ff2442]">{roleLabel(user.role)}</span>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{user.status || "active"}</td>
                  <td className="px-5 py-4 text-neutral-600">{user.location || "—"}</td>
                  <td className="px-5 py-4 text-neutral-600">{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(users ?? []).length === 0 && !error ? (
          <div className="px-5 py-12 text-center text-sm text-neutral-500">{query ? "No users match your search." : "No users found."}</div>
        ) : null}
        <footer className="flex items-center justify-between border-t border-black/5 px-5 py-4 text-sm">
          <span className="text-neutral-500">Page {safePage} of {totalPages}</span>
          <div className="flex gap-2">
            {safePage > 1 ? <Link href={makePageHref(safePage - 1)} className="rounded-lg border border-black/10 px-3 py-2 font-bold">Previous</Link> : null}
            {safePage < totalPages ? <Link href={makePageHref(safePage + 1)} className="rounded-lg border border-black/10 px-3 py-2 font-bold">Next</Link> : null}
          </div>
        </footer>
      </section>
    </div>
  );
}
