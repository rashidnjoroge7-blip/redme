import { AuthPanel } from "@/components/auth/AuthPanel";
import { FeedShell } from "@/components/feed/FeedShell";

export default function HomePage() {
  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <a href="/" className="text-xl font-extrabold text-[#ff2442]">RedNote <span className="font-normal text-neutral-800">· Nairobi Life</span></a>
          <div className="hidden flex-1 sm:block">
            <div className="rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-400">Search Nairobi…</div>
          </div>
          <a href="#auth" className="rounded-full bg-[#ff2442] px-4 py-2 text-sm font-bold text-white">Log in</a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Nairobi, Kenya</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Discover Nairobi life.</h1>
            <p className="mt-3 max-w-2xl text-neutral-600">Stories, creators, places and Kenyan products — now being migrated to a scalable Next.js platform.</p>
          </div>
          <FeedShell />
        </div>
        <aside id="auth" className="lg:sticky lg:top-24 lg:self-start">
          <AuthPanel />
        </aside>
      </section>
    </main>
  );
}
