import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, name, email, avatar, avatar_color1, avatar_color2, bio, location, role, followers_count, following_count, total_likes, created_at",
    )
    .eq("name", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const [
    { count: followersCount },
    { count: followingCount },
    { count: likesCount },
    { data: posts },
  ] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),

    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),

    supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id),

    supabase
      .from("posts")
      .select(
        "id, title, description, category, image_url, created_at, likes_count",
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-[#ff2442]">
          ← Back to RedNote
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <div
            className="h-32"
            style={{
              background: `linear-gradient(135deg, ${
                profile.avatar_color1 ?? "#FF2442"
              }, ${profile.avatar_color2 ?? "#FF6B81"})`,
            }}
          />

          <div className="px-6 pb-7 sm:px-8">
            <div className="-mt-12">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={`${profile.name} profile photo`}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white text-3xl font-black text-white shadow-md"
                  style={{
                    backgroundColor: profile.avatar_color1 ?? "#FF2442",
                  }}
                >
                  {(profile.name?.charAt(0) ?? "R").toUpperCase()}
                </div>
              )}
            </div>

            <div className="mt-4">
              <h1 className="text-3xl font-black text-neutral-900">
                {profile.name || "RedNote User"}
              </h1>

              {profile.location && (
                <p className="mt-1 text-sm text-neutral-500">
                  {profile.location}
                </p>
              )}

              {profile.bio && (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-6 border-t border-neutral-100 pt-5">
              <div>
                <p className="text-lg font-black text-neutral-900">
                  {followersCount ?? profile.followers_count ?? 0}
                </p>
                <p className="text-xs text-neutral-500">Followers</p>
              </div>

              <div>
                <p className="text-lg font-black text-neutral-900">
                  {followingCount ?? profile.following_count ?? 0}
                </p>
                <p className="text-xs text-neutral-500">Following</p>
              </div>

              <div>
                <p className="text-lg font-black text-neutral-900">
                  {likesCount ?? profile.total_likes ?? 0}
                </p>
                <p className="text-xs text-neutral-500">Likes</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-black text-neutral-900">Posts</h2>

          {!posts || posts.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-6 text-sm text-neutral-500 shadow-sm">
              This user has not published any posts yet.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  {post.title && (
                    <h3 className="font-bold text-neutral-900">{post.title}</h3>
                  )}

                  {post.description && (
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {post.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400">
                    {post.category && (
                      <span className="capitalize">{post.category}</span>
                    )}

                    <span>{post.likes_count ?? 0} likes</span>

                    {post.created_at && (
                      <time dateTime={post.created_at}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </time>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
