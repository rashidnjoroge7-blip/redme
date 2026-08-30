import Link from "next/link";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { LiveFeedShell } from "@/components/feed/LiveFeedShell";
import { getFeedPosts } from "@/lib/data/posts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { posts, error } = await getFeedPosts({ limit: 20 });

  return (
    <main className="min-h-screen bg-[#fafafa] pb-16">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link href="/" className="text-xl font-extrabold text-[#ff2442]">
            RedNote <span className="font-normal text-neutral-800">· Nairobi Life</span>
          </Link>
          <form action="/feed" className="hidden flex-1 sm:block">
            <input name="q" placeholder="Search Nairobi…" aria-label="Search RedNote posts" className="w-full rounded-full bg-neutral-100 px-4 py-2 text-sm outline-none ring-[#ff2442] focus:ring-2" />
          </form>
          <Link href="/account" className="rounded-full bg-[#ff2442] px-4 py-2 text-sm font-bold text-white">Account</Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Nairobi, Kenya</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Discover Nairobi life.</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">Stories, creators, places and Kenyan products — powered by the RedNote Next.js platform.</p>
      </section>
      <LiveFeedShell posts={posts} error={Boolean(error)} activeCategory="All" search="" />
      <section id="auth" className="mx-auto max-w-md px-4 py-10"><AuthPanel /></section>
    </main>
  );
}
