import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { moderatePost } from "../actions";

export const dynamic = "force-dynamic";

type PostDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[] | null;
  image_url: string | null;
  likes_count: number | null;
  moderation_status: "published" | "hidden";
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
  profiles: { id: string; name: string | null; email: string | null; location: string | null; bio: string | null } | null;
};

type AuditEntry = {
  id: string;
  action: "hide" | "restore";
  reason: string | null;
  created_at: string;
  actor_id: string;
  profiles: { name: string | null; email: string | null } | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminPostReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { admin } = await requireAdmin();
  const { id } = await params;

  const [{ data, error }, { data: auditData, error: auditError }] = await Promise.all([
    admin.from("posts").select("id,title,description,category,tags,image_url,likes_count,moderation_status,user_id,created_at,updated_at,profiles!posts_user_id_fkey(id,name,email,location,bio)").eq("id", id).maybeSingle(),
    admin.from("post_moderation_audit").select("id,action,reason,created_at,actor_id,profiles!post_moderation_audit_actor_id_fkey(name,email)").eq("post_id", id).order("created_at", { ascending: false }),
  ]);

  if (error) throw new Error(`Unable to load post: ${error.message}`);
  if (!data) notFound();

  const post = data as unknown as PostDetail;
  const audit = (auditData ?? []) as unknown as AuditEntry[];
  const isHidden = post.moderation_status === "hidden";

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/posts" className="text-sm font-bold text-[#ff2442]">← Back to Posts</Link>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Moderation / Review</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div><h1 className="text-3xl font-black tracking-tight">{post.title}</h1><p className="mt-2 text-sm text-neutral-500">Post ID: {post.id}</p></div>
          <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide ${isHidden ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{post.moderation_status}</span>
        </div>
      </header>

      <div className={`rounded-2xl border px-4 py-3 text-sm ${isHidden ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
        {isHidden ? "This post is hidden from normal public reads. Administrators can still review it." : "This post is currently published and visible to normal public reads."}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <article className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            {post.image_url ? <div className="border-b border-black/5 bg-neutral-50 p-4"><img src={post.image_url} alt={post.title} className="max-h-[520px] w-full rounded-xl object-contain" /></div> : null}
            <div className="p-6">
              <div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#fff0f2] px-3 py-1 text-xs font-bold capitalize text-[#ff2442]">{post.category}</span>{(post.tags ?? []).map((tag) => <span key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">#{tag}</span>)}</div>
              <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-neutral-700">{post.description || "No description provided."}</p>
            </div>
          </article>

          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Moderation action</h2>
            <p className="mt-1 text-sm text-neutral-500">Actions are executed by the protected database moderation RPC and recorded in the audit trail.</p>
            <form action={moderatePost} className="mt-5 space-y-4">
              <input type="hidden" name="postId" value={post.id} />
              <label className="block"><span className="text-sm font-bold">Reason (optional)</span><textarea name="reason" maxLength={1000} rows={4} placeholder="Explain why this post is being hidden or restored…" className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#ff2442]" /></label>
              {isHidden ? <button name="action" value="restore" type="submit" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white">Restore post</button> : <button name="action" value="hide" type="submit" className="rounded-xl bg-[#ff2442] px-5 py-3 text-sm font-bold text-white">Hide post</button>}
            </form>
          </section>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Post details</h2><dl className="mt-4 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-neutral-500">Likes</dt><dd className="font-bold">{(post.likes_count ?? 0).toLocaleString("en-KE")}</dd></div><div className="flex justify-between gap-4"><dt className="text-neutral-500">Created</dt><dd className="text-right font-semibold">{formatDate(post.created_at)}</dd></div><div className="flex justify-between gap-4"><dt className="text-neutral-500">Updated</dt><dd className="text-right font-semibold">{formatDate(post.updated_at)}</dd></div><div className="flex justify-between gap-4"><dt className="text-neutral-500">Author ID</dt><dd className="max-w-[190px] break-all text-right font-mono text-xs">{post.user_id}</dd></div></dl></section>
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Author</h2><div className="mt-4 space-y-2 text-sm"><p className="font-bold">{post.profiles?.name || "Unnamed user"}</p><p className="text-neutral-600">{post.profiles?.email || "No email"}</p><p className="text-neutral-600">{post.profiles?.location || "No location"}</p>{post.profiles?.bio ? <p className="pt-2 leading-6 text-neutral-500">{post.profiles.bio}</p> : null}<Link href={`/admin/users/${post.user_id}`} className="mt-3 inline-block text-sm font-bold text-[#ff2442]">View author account →</Link></div></section>
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Moderation history</h2>{auditError ? <p className="mt-4 text-sm text-amber-700">Moderation history could not be loaded.</p> : audit.length === 0 ? <p className="mt-4 text-sm text-neutral-500">No moderation actions recorded.</p> : <div className="mt-4 space-y-4">{audit.map((entry) => <div key={entry.id} className="border-l-2 border-neutral-200 pl-3"><p className="text-sm font-bold capitalize">{entry.action}</p><p className="mt-1 text-xs text-neutral-500">{formatDate(entry.created_at)}</p><p className="mt-1 text-xs text-neutral-500">By {entry.profiles?.name || entry.profiles?.email || entry.actor_id}</p>{entry.reason ? <p className="mt-2 text-sm leading-5 text-neutral-600">{entry.reason}</p> : null}</div>)}</div>}</section>
        </aside>
      </div>
    </div>
  );
}
