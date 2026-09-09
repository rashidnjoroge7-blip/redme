import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

type PostRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  tags: string[] | null;
  likes_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  profiles: { id: string; name: string | null; email: string | null; location: string | null } | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminPostReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { admin } = await requireAdmin();
  const { id } = await params;

  const { data, error } = await admin
    .from("posts")
    .select("id,title,description,category,image_url,tags,likes_count,created_at,updated_at,user_id,profiles!posts_user_id_fkey(id,name,email,location)")
    .eq("id", id)
    .maybeSingle();

  if (!data && !error) notFound();

  const post = data as unknown as PostRow | null;

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/posts" className="text-sm font-bold text-[#ff2442]">← Posts Moderation</Link>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Moderation Review</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Post review</h1>
        <p className="mt-2 text-sm text-neutral-600">Review the complete post record before moderation actions are enabled.</p>
      </header>

      {error ? (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This post could not be loaded. Check the post ID and administrator database access.
        </div>
      ) : post ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#fff0f2] px-3 py-1 text-xs font-bold capitalize text-[#ff2442]">{post.category}</span>
                <span className="text-xs font-semibold text-neutral-500">{(post.likes_count ?? 0).toLocaleString("en-KE")} likes</span>
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight">{post.title}</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{post.description || "No description provided."}</p>

              {post.image_url ? (
                <div className="mt-6 overflow-hidden rounded-2xl border border-black/5 bg-neutral-50">
                  <img src={post.image_url} alt="Post media" className="max-h-[520px] w-full object-contain" />
                </div>
              ) : null}

              {post.tags?.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => <span key={tag} className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-neutral-600">#{tag}</span>)}
                </div>
              ) : null}
            </article>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h3 className="font-black">Author</h3>
                <p className="mt-4 font-bold">{post.profiles?.name || "Unnamed user"}</p>
                <p className="mt-1 text-sm text-neutral-500">{post.profiles?.email || post.user_id}</p>
                {post.profiles?.location ? <p className="mt-2 text-sm text-neutral-500">{post.profiles.location}</p> : null}
                {post.profiles?.id ? <Link href={`/admin/users/${post.profiles.id}`} className="mt-4 inline-block text-sm font-bold text-[#ff2442]">View author →</Link> : null}
              </section>

              <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h3 className="font-black">Post metadata</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-neutral-500">Created</dt><dd className="text-right font-semibold">{formatDate(post.created_at)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-neutral-500">Updated</dt><dd className="text-right font-semibold">{formatDate(post.updated_at)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-neutral-500">Post ID</dt><dd className="max-w-[220px] break-all text-right font-mono text-xs">{post.id}</dd></div>
                </dl>
              </section>
            </aside>
          </section>

          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <h3 className="font-black text-blue-950">Moderation actions</h3>
            <p className="mt-2 text-sm text-blue-900">Hide, restore, and delete are intentionally unavailable until a dedicated moderation state and audit mechanism are verified against the live database.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" disabled className="cursor-not-allowed rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-300">Hide post</button>
              <button type="button" disabled className="cursor-not-allowed rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-300">Restore post</button>
              <button type="button" disabled className="cursor-not-allowed rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-300">Delete post</button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
