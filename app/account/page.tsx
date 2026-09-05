import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFeedPosts } from "@/lib/data/posts";

export const dynamic = "force-dynamic";

const categories = [
  ["🍽️", "Food", "Food"],
  ["👗", "Fashion", "Fashion"],
  ["✈️", "Travel", "Travel"],
  ["🏡", "Home", "Home"],
  ["🌿", "Nature", "Nature"],
  ["🐾", "Pets", "Pets"],
  ["📚", "Books", "Books"],
  ["✨", "Beauty", "Beauty"],
  ["💪", "Fitness", "Fitness"],
] as const;

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) redirect("/login");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect("/login");

  const { posts } = await getFeedPosts({ limit: 4 });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-6 pb-16 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#ff2442]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#ff6b81]/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="glass-strong sticky top-4 z-20 flex items-center justify-between gap-4 rounded-3xl px-5 py-3.5 sm:px-6">
          <Link href="/" className="text-xl font-extrabold text-[#ff2442]">
            RedNote <span className="font-normal text-neutral-800">· Nairobi Life</span>
          </Link>
          <nav className="hidden items-center gap-2 sm:flex">
            <Link href="/feed" className="rounded-full px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-white/70">Feed</Link>
            <Link href="/marketplace" className="rounded-full px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-white/70">Market</Link>
          </nav>
          <form action="/auth/signout" method="post">
            <button className="rounded-full bg-[#ff2442] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:scale-[1.02]" type="submit">Log out</button>
          </form>
        </header>

        <section className="mt-6 glass-strong overflow-hidden rounded-[2rem] p-6 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Nairobi, Kenya</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-[#1a1a1a] sm:text-5xl">Welcome back. 🇰🇪</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">Your RedNote starting point for discovering local stories, creators, ideas and products.</p>
            </div>
            <div className="glass rounded-2xl px-4 py-3 lg:min-w-72">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff2442]">Signed in</p>
              <p className="mt-1 break-all text-sm font-semibold text-[#1a1a1a]">{userData.user.email}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Link href="/feed" className="glass-hover glass rounded-3xl p-5">
              <span className="text-3xl">📰</span><h2 className="mt-4 font-black">Explore Feed</h2>
              <p className="mt-1 text-sm leading-5 text-neutral-500">See the latest RedNote conversations.</p>
              <span className="mt-4 inline-block text-sm font-bold text-[#ff2442]">Open feed →</span>
            </Link>
            <Link href="/marketplace" className="glass-hover glass rounded-3xl p-5">
              <span className="text-3xl">🛍️</span><h2 className="mt-4 font-black">RedNote Market</h2>
              <p className="mt-1 text-sm leading-5 text-neutral-500">Discover products from local sellers.</p>
              <span className="mt-4 inline-block text-sm font-bold text-[#ff2442]">Shop now →</span>
            </Link>
            <Link href="/" className="glass-hover glass rounded-3xl p-5">
              <span className="text-3xl">✨</span><h2 className="mt-4 font-black">Nairobi Home</h2>
              <p className="mt-1 text-sm leading-5 text-neutral-500">Return to the main RedNote experience.</p>
              <span className="mt-4 inline-block text-sm font-bold text-[#ff2442]">Go home →</span>
            </Link>
          </div>
        </section>

        <section className="mt-6 glass-strong rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#ff2442]">Explore by interest</p>
              <h2 className="mt-2 text-2xl font-black text-[#1a1a1a]">Find your Nairobi.</h2>
              <p className="mt-2 text-sm text-neutral-600">Jump directly into the topics people are sharing on RedNote.</p>
            </div>
            <Link href="/feed" className="text-sm font-bold text-[#ff2442]">View all posts →</Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map(([icon, label, value]) => (
              <Link key={value} href={`/feed?category=${value}`} className="rounded-full border border-white/80 bg-white/65 px-4 py-2.5 text-sm font-bold text-neutral-700 shadow-sm backdrop-blur-xl transition hover:border-[#ff2442]/20 hover:text-[#ff2442]">
                {icon} {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
          <div className="glass-strong rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#ff2442]">Live from RedNote</p><h2 className="mt-2 text-2xl font-black">Latest stories</h2></div>
              <Link href="/feed" className="text-sm font-bold text-[#ff2442]">See all →</Link>
            </div>
            {posts.length === 0 ? (
              <div className="glass mt-5 rounded-3xl p-6 text-center text-sm text-neutral-500">No posts are available yet. Be the first to explore RedNote.</div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {posts.map((post) => (
                  <article key={post.id} className="glass overflow-hidden rounded-3xl">
                    {post.imageUrl ? <div className="relative aspect-[16/9] bg-[#fff0f0]"><Image src={post.imageUrl} alt={post.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /></div> : null}
                    <div className="p-5">
                      <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#ff2442]">{post.category}</span>
                      <h3 className="mt-3 line-clamp-2 font-black text-[#1a1a1a]">{post.title}</h3>
                      {post.description && <p className="mt-2 line-clamp-2 text-sm leading-5 text-neutral-500">{post.description}</p>}
                      <div className="mt-4 text-xs font-medium text-neutral-400">♥ {post.likesCount} · 💬 {post.commentsCount}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="glass-strong rounded-[2rem] p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#ff2442]">Quick access</p>
            <div className="mt-4 space-y-3">
              <Link href="/feed" className="glass-hover flex items-center justify-between rounded-2xl p-4"><span className="font-bold">Latest posts</span><span>→</span></Link>
              <Link href="/marketplace" className="glass-hover flex items-center justify-between rounded-2xl p-4"><span className="font-bold">Shop products</span><span>→</span></Link>
              <Link href="/" className="glass-hover flex items-center justify-between rounded-2xl p-4"><span className="font-bold">RedNote home</span><span>→</span></Link>
            </div>
            <div className="glass-red mt-5 rounded-2xl p-4 text-sm leading-6"><strong>Made for Nairobi.</strong><br />Discover what is happening around you, one story at a time.</div>
          </aside>
        </section>
      </div>
    </main>
  );
}
