import Image from "next/image";
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
    <main className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-8">
      {" "}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {" "}
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#ff2442]/10 blur-3xl" />{" "}
        <div className="absolute -right-40 top-60 h-[28rem] w-[28rem] rounded-full bg-[#ff6b81]/10 blur-3xl" />{" "}
      </div>
      ```
      <div className="relative mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex rounded-full border border-white/80 bg-white/60 px-4 py-2 text-sm font-semibold text-[#ff2442] shadow-sm backdrop-blur-xl transition hover:bg-white"
        >
          â† Back to RedNote
        </Link>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/80 bg-white/65 shadow-[0_20px_70px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
          <div
            className="relative h-36 sm:h-44"
            style={{
              background: `linear-gradient(135deg, ${
                profile.avatar_color1 ?? "#FF2442"
              }, ${profile.avatar_color2 ?? "#FF6B81"})`,
            }}
          >
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
          </div>

          <div className="relative px-6 pb-7 sm:px-8">
            <div className="-mt-14">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={`${profile.name} profile photo`}
                  width={112}
                  height={112}
                  className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-xl ring-1 ring-black/5"
                />
              ) : (
                <div
                  className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white text-4xl font-black text-white shadow-xl"
                  style={{
                    backgroundColor: profile.avatar_color1 ?? "#FF2442",
                  }}
                >
                  {(profile.name?.charAt(0) ?? "R").toUpperCase()}
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-neutral-900">
                  {profile.name || "RedNote User"}
                </h1>

                {profile.role && (
                  <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-xs font-bold capitalize text-[#ff2442]">
                    {profile.role}
                  </span>
                )}
              </div>

              {profile.location && (
                <p className="mt-2 text-sm text-neutral-500">
                  ðŸ“ {profile.location}
                </p>
              )}

              {profile.bio && (
                <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-600">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3 border-t border-black/5 pt-6">
              <Stat
                value={followersCount ?? profile.followers_count ?? 0}
                label="Followers"
              />
              <Stat
                value={followingCount ?? profile.following_count ?? 0}
                label="Following"
              />
              <Stat
                value={likesCount ?? profile.total_likes ?? 0}
                label="Likes"
              />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff2442]">
                Community
              </p>
              <h2 className="mt-1 text-2xl font-black text-neutral-900">
                Posts
              </h2>
            </div>

            <span className="rounded-full border border-white/80 bg-white/60 px-3 py-1.5 text-xs font-semibold text-neutral-500 backdrop-blur-xl">
              {posts?.length ?? 0} published
            </span>
          </div>

          {!posts || posts.length === 0 ? (
            <div className="rounded-3xl border border-white/80 bg-white/65 p-8 text-center shadow-[0_12px_45px_rgba(0,0,0,0.05)] backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0f0] text-2xl">
                âœ¦
              </div>
              <p className="mt-4 text-sm font-semibold text-neutral-700">
                No posts yet
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                This user has not published any posts yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-3xl border border-white/80 bg-white/65 shadow-[0_12px_45px_rgba(0,0,0,0.05)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-[0_18px_55px_rgba(255,36,66,0.08)]"
                >
                  {post.image_url && (
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      width={1200}
                      height={800}
                      sizes="(max-width: 768px) 100vw, 1200px"
                      className="max-h-[26rem] w-full object-cover"
                    />
                  )}

                  <div className="p-5 sm:p-6">
                    {post.category && (
                      <span className="inline-flex rounded-full bg-[#fff0f0] px-3 py-1 text-xs font-bold capitalize text-[#ff2442]">
                        {post.category}
                      </span>
                    )}

                    {post.title && (
                      <h3 className="mt-3 text-lg font-black text-neutral-900">
                        {post.title}
                      </h3>
                    )}

                    {post.description && (
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {post.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                      <span>{post.likes_count ?? 0} likes</span>

                      {post.created_at && (
                        <time dateTime={post.created_at}>
                          {new Date(post.created_at).toLocaleDateString()}
                        </time>
                      )}
                    </div>
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

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/50 px-3 py-4 text-center backdrop-blur-xl">
      {" "}
      <p className="text-xl font-black text-neutral-900">{value}</p>{" "}
      <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>{" "}
    </div>
  );
}
