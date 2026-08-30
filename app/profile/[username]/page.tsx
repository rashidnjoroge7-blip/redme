import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, bio, location, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) notFound();

  const [{ count: followers }, { count: following }, { data: posts }] = await Promise.all([
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profile.id),
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", profile.id),
    supabase.from("posts").select("id, title, description, category, image_url, created_at, likes_count, comments_count").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(30),
  ]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="text-sm font-semibold text-[#ff2442]">← RedNote</a>
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#fff0f0] text-3xl">🇰🇪</div>}
            <div>
              <h1 className="text-3xl font-black">{profile.full_name || profile.username}</h1>
              <p className="text-sm text-neutral-500">@{profile.username}</p>
              {profile.location && <p className="mt-2 text-sm text-neutral-600">{profile.location}</p>}
              {profile.bio && <p className="mt-2 max-w-2xl text-neutral-700">{profile.bio}</p>}
              <div className="mt-4 flex gap-5 text-sm"><span><strong>{followers ?? 0}</strong> followers</span><span><strong>{following ?? 0}</strong> following</span><span><strong>{posts?.length ?? 0}</strong> posts</span></div>
            </div>
          </div>
        </section>
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(posts ?? []).map((post) => <article key={post.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">{post.image_url ? <img src={post.image_url} alt={post.title} className="aspect-[4/5] w-full object-cover" /> : <div className="aspect-[4/5] bg-gradient-to-br from-[#fff0f0] to-neutral-100" />}<div className="p-4"><p className="text-xs font-bold uppercase text-[#ff2442]">{post.category}</p><h2 className="mt-1 font-bold">{post.title}</h2><p className="mt-2 text-xs text-neutral-500">{post.likes_count} likes · {post.comments_count} comments</p></div></article>)}
        </section>
      </div>
    </main>
  );
}
