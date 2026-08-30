import { LiveFeedShell } from "@/components/feed/LiveFeedShell";
import { getFeedPosts } from "@/lib/data/posts";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const { posts, error } = await getFeedPosts();

  return (
    <main className="min-h-screen bg-[#fafafa] pb-16">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="text-xl font-extrabold text-[#ff2442]">
            RedNote <span className="font-normal text-neutral-800">· Nairobi Life</span>
          </a>
          <a href="/account" className="rounded-full bg-[#ff2442] px-4 py-2 text-sm font-bold text-white">
            Account
          </a>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Nairobi, Kenya</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Discover Nairobi life.</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">Live posts from the RedNote Supabase database.</p>
      </section>
      <LiveFeedShell posts={posts} error={Boolean(error)} />
    </main>
  );
}
