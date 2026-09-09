import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import ReportControls from "./ReportControls";

export const dynamic = "force-dynamic";

type Report = {
  id: string; post_id: string; reporter_id: string; reason: string; details: string | null;
  status: "open" | "under_review" | "resolved" | "dismissed"; resolution: string | null;
  created_at: string; updated_at: string;
  posts: { title: string | null; moderation_status: "published" | "hidden" } | null;
  profiles: { name: string | null; email: string | null; location: string | null } | null;
};

function formatDate(value: string) { return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export default async function AdminReportReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { admin } = await requireAdmin();
  const { id } = await params;
  const { data, error } = await admin.from("post_reports" as never).select("id,post_id,reporter_id,reason,details,status,resolution,created_at,updated_at,posts!post_reports_post_id_fkey(title,moderation_status),profiles!post_reports_reporter_id_fkey(name,email,location)").eq("id", id).maybeSingle();
  if (error) throw new Error(`Unable to load report: ${error.message}`);
  if (!data) notFound();
  const report = data as unknown as Report;

  return (
    <div className="space-y-6">
      <header><Link href="/admin/reports" className="text-sm font-bold text-[#ff2442]">← Back to Reports</Link><p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Safety / Report review</p><h1 className="mt-1 text-3xl font-black tracking-tight">{report.reason}</h1><p className="mt-2 text-sm text-neutral-500">Report ID: {report.id}</p></header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Reported post</h2><div className="mt-4 rounded-xl bg-neutral-50 p-4"><Link href={`/admin/posts/${report.post_id}`} className="font-bold hover:text-[#ff2442]">{report.posts?.title || "Open reported post"} →</Link><p className="mt-2 text-sm text-neutral-500">Current moderation status: {report.posts?.moderation_status || "unknown"}</p></div></article>
          <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Report details</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{report.details || "No additional details provided."}</p></article>
          <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Resolution</h2><p className="mt-1 text-sm text-neutral-500">Move the report through review, resolution, or dismissal. Confirmed violations can be handled from the reported post.</p><ReportControls reportId={report.id} status={report.status} resolution={report.resolution} /></article>
        </section>
        <aside className="space-y-6">
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Report status</h2><p className="mt-4 inline-flex rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide">{report.status.replace("_", " ")}</p><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-neutral-500">Created</dt><dd className="text-right font-semibold">{formatDate(report.created_at)}</dd></div><div className="flex justify-between gap-4"><dt className="text-neutral-500">Updated</dt><dd className="text-right font-semibold">{formatDate(report.updated_at)}</dd></div></dl></section>
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Reporter</h2><div className="mt-4 space-y-2 text-sm"><p className="font-bold">{report.profiles?.name || "Unnamed user"}</p><p className="text-neutral-600">{report.profiles?.email || report.reporter_id}</p><p className="text-neutral-600">{report.profiles?.location || "No location"}</p><Link href={`/admin/users/${report.reporter_id}`} className="mt-3 inline-block font-bold text-[#ff2442]">View reporter account →</Link></div></section>
        </aside>
      </div>
    </div>
  );
}
