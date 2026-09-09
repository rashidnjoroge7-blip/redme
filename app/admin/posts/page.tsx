import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

type PostRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  likes_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  profiles: { name: string | null; email: string | null } | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
function truncate(value: string | null, length = 140) {
  if (!value) return "No description";
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { admin } = await requireAdmin();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  let builder = admin.from("posts").select("id,title,description,category,likes_count,created_at,updated_at,user_id,profiles!posts_user_id_fkey(name,email)", { count: "exact" }).order("created_at", { ascending: false });
  if (query) {
    const escaped = query.replaceAll(",", "");
    builder = builder.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }
  const { data, count, error } = await builder.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const posts = (data ?? []) as unknown as PostRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const makePageHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (nextPage > 1) next.set("page", String(nextPage));
    const value = next.toString();
    return value ? `/admin/posts?${value}` : "/admin/posts";
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><Link href="/admin" className="text-sm font-bold text-[#ff2442]">← Admin Dashboard</Link><p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Moderation</p><h1 className="mt-1 text-3xl font-black tracking-tight">Posts</h1><p className="mt-2 text-sm text-neutral-600">Review community posts before moderation actions are enabled.</p></div>
        <div className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm"><p className="text-xs font-semibold text-neutral-500">Total posts</p><p className="mt-1 text-xl font-black">{total.toLocaleString("en-KE")}</p></div>
      </header>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">Read-only moderation view. Hide, restore, and delete actions will be added only after the live moderation schema is verified.</div>
      <form className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm" method="get"><div className="flex flex-col gap-3 sm:flex-row"><input name="q" defaultValue={query} placeholder="Search by title or description…" aria-label="Search posts" className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff2442]" /><button type="submit" className="rounded-xl bg-[#ff2442] px-5 py-3 text-sm font-bold text-white">Search</button>{query ? <Link href="/admin/posts" className="rounded-xl border border-black/10 px-5 py-3 text-center text-sm font-bold">Clear</Link> : null}</div></form>
      {error ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Posts could not be loaded. Check the posts schema and administrator database access.</div> : null}
      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="border-b border-black/5 bg-neutral-50"><tr><th className="px-5 py-4 font-bold">Post</th><th className="px-5 py-4 font-bold">Author</th><th className="px-5 py-4 font-bold">Category</th><th className="px-5 py-4 font-bold">Likes</th><th className="px-5 py-4 font-bold">Created</th><th className="px-5 py-4 font-bold">Action</th></tr></thead><tbody>{posts.map((post) => <tr key={post.id} className="border-b border-black/5 last:border-0"><td className="max-w-[420px] px-5 py-4"><p className="font-bold text-[#1a1a1a]">{post.title}</p><p className="mt-1 text-xs leading-5 text-neutral-500">{truncate(post.description)}</p></td><td className="px-5 py-4"><p className="font-semibold">{post.profiles?.name || "Unnamed user"}</p><p className="mt-1 text-xs text-neutral-500">{post.profiles?.email || post.user_id}</p></td><td className="px-5 py-4"><span className="rounded-full bg-[#fff0f2] px-3 py-1 text-xs font-bold capitalize text-[#ff2442]">{post.category}</span></td><td className="px-5 py-4 font-semibold">{(post.likes_count ?? 0).toLocaleString("en-KE")}</td><td className="px-5 py-4 text-neutral-600">{formatDate(post.created_at)}</td><td className="px-5 py-4"><Link href={`/admin/posts/${post.id}`} className="rounded-lg border border-black/10 px-3 py-2 text-xs font-bold hover:border-[#ff2442] hover:text-[#ff2442]">Review</Link></td></tr>)}</tbody></table></div>{posts.length === 0 && !error ? <div className="px-5 py-12 text-center text-sm text-neutral-500">{query ? "No posts match your search." : "No posts found."}</div> : null}<footer className="flex items-center justify-between border-t border-black/5 px-5 py-4 text-sm"><span className="text-neutral-500">Page {safePage} of {totalPages}</span><div className="flex gap-2">{safePage > 1 ? <Link href={makePageHref(safePage - 1)} className="rounded-lg border border-black/10 px-3 py-2 font-bold">Previous</Link> : null}{safePage < totalPages ? <Link href={makePageHref(safePage + 1)} className="rounded-lg border border-black/10 px-3 py-2 font-bold">Next</Link> : null}</div></footer></section>
    </div>
  );
}
