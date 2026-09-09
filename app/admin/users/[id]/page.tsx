import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}
function roleLabel(role: string | null) { return role ? role.replaceAll("_", " ") : "user"; }

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { admin, user: currentAdmin } = await requireAdmin();
  const { id } = await params;
  const { data: profile, error } = await admin.from("profiles").select("id,name,email,role,status,location,bio,following_count,followers_count,total_likes,created_at,updated_at").eq("id", id).maybeSingle();
  if (error || !profile) notFound();
  const isCurrentAdmin = currentAdmin.id === profile.id;
  return (
    <div className="space-y-6">
      <header><Link href="/admin/users" className="text-sm font-bold text-[#ff2442]">← Back to Users</Link><p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">User details</p><h1 className="mt-1 text-3xl font-black tracking-tight">{profile.name || "Unnamed user"}</h1><p className="mt-2 break-all text-sm text-neutral-600">{profile.email || "No email"}</p></header>
      {isCurrentAdmin ? <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"><strong>This is your administrator account.</strong> Role and status mutations are intentionally disabled for the current administrator in this read-only stage.</div> : null}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:col-span-2"><h2 className="font-black">Profile</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2">{[["Role", roleLabel(profile.role)], ["Status", profile.status || "active"], ["Location", profile.location || "—"], ["Joined", formatDate(profile.created_at)], ["Last updated", formatDate(profile.updated_at)], ["User ID", profile.id]].map(([label, value]) => <div key={label} className="rounded-xl bg-neutral-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</dt><dd className="mt-1 break-all text-sm font-semibold capitalize">{value}</dd></div>)}</dl>{profile.bio ? <div className="mt-5 rounded-xl border border-black/5 p-4"><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Bio</p><p className="mt-2 text-sm leading-6 text-neutral-700">{profile.bio}</p></div> : null}</div>
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="font-black">Community activity</h2><dl className="mt-5 space-y-3">{[["Following", profile.following_count ?? 0], ["Followers", profile.followers_count ?? 0], ["Total likes", profile.total_likes ?? 0]].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-black/5 pb-3 last:border-0 last:pb-0"><dt className="text-sm text-neutral-500">{label}</dt><dd className="font-black">{Number(value).toLocaleString("en-KE")}</dd></div>)}</dl></div>
      </section>
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="font-black">Administrative actions</h2><p className="mt-2 text-sm text-neutral-500">Role and account-status controls will be enabled after the audit-safe mutation layer is added.</p><div className="mt-5 flex flex-wrap gap-3"><span className="rounded-xl bg-neutral-100 px-4 py-3 text-sm font-bold text-neutral-500">Change role — Stage 2C</span><span className="rounded-xl bg-neutral-100 px-4 py-3 text-sm font-bold text-neutral-500">Change status — Stage 2C</span></div></section>
    </div>
  );
}
