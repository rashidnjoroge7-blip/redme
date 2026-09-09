import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

type Report = {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: "open" | "under_review" | "resolved" | "dismissed";
  resolution: string | null;
  created_at: string;
  updated_at: string;
  posts: { title: string | null; moderation_status: "published" | "hidden" } | null;
  profiles: { name: string | null; email: string | null } | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const statusClasses: Record<Report["status"], string> = {
  open: "bg-red-50 text-red-700",
  under_review: "bg-amber-50 text-amber-800",
  resolved: "bg-emerald-50 text-emerald-700",
  dismissed: "bg-neutral-100 text-neutral-600",
};

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const { admin } = await requireAdmin();
  const params = await searchParams;
  const requestedStatus = params.status;
  const status: Report["status"] = ["open", "under_review", "resolved", "dismissed"].includes(requestedStatus ?? "")
    ? (requestedStatus as Report["status"])
    : "open";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const builder = admin
    .from("post_reports" as never)
    .select("id,post_id,reporter_id,reason,details,status,resolution,created_at,updated_at,posts!post_reports_post_id_fkey(title,moderation_status),profiles!post_reports_reporter_id_fkey(name,email)", { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: false });

  const { data, count, error } = await builder.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const reports = (data ?? []) as unknown as Report[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const makeHref = (nextPage: number) => `/admin/reports?status=${status}&page=${nextPage}`;

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin" className="text-sm font-bold text-[#ff2442]">â† Admin Dashboard</Link>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Safety & moderation</p>
        <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><h1 className="text-3xl font-black tracking-tight">Reports</h1><p className="mt-2 text-sm text-neutral-600">Review community reports and route confirmed violations into post moderation.</p></div>
          <div className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm"><p className="text-xs font-semibold text-neutral-500">{status.replace("_", " ")} reports</p><p className="mt-1 text-xl font-black">{total.toLocaleString("en-KE")}</p></div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {["open", "under_review", "resolved", "dismissed"].map((value) => (
          <Link key={value} href={`/admin/reports?status=${value}`} className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${value === status ? "bg-[#ff2442] text-white" : "bg-white text-neutral-600 border border-black/10"}`}>{value.replace("_", " ")}</Link>
        ))}
      </div>

      {error ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Reports could not be loaded. Apply the Stage 4 reports migration, then regenerate database types.</div> : null}

      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-black/5 bg-neutral-50"><tr><th className="px-5 py-4 font-bold">Report</th><th className="px-5 py-4 font-bold">Post</th><th className="px-5 py-4 font-bold">Reporter</th><th className="px-5 py-4 font-bold">Status</th><th className="px-5 py-4 font-bold">Created</th><th className="px-5 py-4 font-bold">Action</th></tr></thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-black/5 last:border-0">
                  <td className="max-w-[330px] px-5 py-4"><p className="font-bold">{report.reason}</p>{report.details ? <p className="mt-1 truncate text-xs text-neutral-500">{report.details}</p> : null}</td>
                  <td className="px-5 py-4"><Link href={`/admin/posts/${report.post_id}`} className="font-semibold hover:text-[#ff2442]">{report.posts?.title || "Post"}</Link><p className="mt-1 text-xs text-neutral-500">{report.posts?.moderation_status || "unknown"}</p></td>
                  <td className="px-5 py-4"><p className="font-semibold">{report.profiles?.name || "Unnamed user"}</p><p className="mt-1 text-xs text-neutral-500">{report.profiles?.email || report.reporter_id}</p></td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClasses[report.status]}`}>{report.status.replace("_", " ")}</span></td>
                  <td className="px-5 py-4 text-neutral-600">{formatDate(report.created_at)}</td>
                  <td className="px-5 py-4"><Link href={`/admin/reports/${report.id}`} className="rounded-lg border border-black/10 px-3 py-2 text-xs font-bold hover:border-[#ff2442] hover:text-[#ff2442]">Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!error && reports.length === 0 ? <div className="px-5 py-12 text-center text-sm text-neutral-500">No {status.replace("_", " ")} reports.</div> : null}
        <footer className="flex items-center justify-between border-t border-black/5 px-5 py-4 text-sm"><span className="text-neutral-500">Page {safePage} of {totalPages}</span><div className="flex gap-2">{safePage > 1 ? <Link href={makeHref(safePage - 1)} className="rounded-lg border border-black/10 px-3 py-2 font-bold">Previous</Link> : null}{safePage < totalPages ? <Link href={makeHref(safePage + 1)} className="rounded-lg border border-black/10 px-3 py-2 font-bold">Next</Link> : null}</div></footer>
      </section>
    </div>
  );
}
