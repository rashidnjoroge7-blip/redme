import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    redirect("/login");
  }

  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData.user) {
    redirect("/login");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-8 pb-16 sm:py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#ff2442]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#ff6b81]/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="glass-strong flex items-center justify-between gap-4 rounded-3xl px-5 py-4 sm:px-6">
          <Link href="/" className="text-xl font-extrabold text-[#ff2442]">
            RedNote <span className="font-normal text-neutral-800">· Nairobi Life</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button
              className="rounded-full border border-[#ff2442]/15 bg-white/70 px-4 py-2 text-sm font-bold text-[#ff2442] transition hover:bg-[#fff0f0]"
              type="submit"
            >
              Log out
            </button>
          </form>
        </header>

        <section className="mt-6 glass-strong rounded-[2rem] p-6 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">
                Your RedNote
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-[#1a1a1a] sm:text-5xl">
                Welcome back. 🇰🇪
              </h1>
              <p className="mt-3 max-w-2xl text-neutral-600">
                Your Nairobi starting point for stories, creators, places and Kenyan products.
              </p>
            </div>
            <div className="glass rounded-2xl px-4 py-3 sm:min-w-64">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff2442]">
                Signed in
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-[#1a1a1a]">
                {userData.user.email}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Link href="/feed" className="glass-hover glass rounded-3xl p-5">
              <span className="text-3xl">📰</span>
              <h2 className="mt-4 font-black text-[#1a1a1a]">Explore Feed</h2>
              <p className="mt-1 text-sm leading-5 text-neutral-500">Discover live RedNote posts and search Nairobi.</p>
              <span className="mt-4 inline-block text-sm font-bold text-[#ff2442]">Open feed →</span>
            </Link>

            <Link href="/marketplace" className="glass-hover glass rounded-3xl p-5">
              <span className="text-3xl">🛍️</span>
              <h2 className="mt-4 font-black text-[#1a1a1a]">RedNote Market</h2>
              <p className="mt-1 text-sm leading-5 text-neutral-500">Browse products from RedNote sellers.</p>
              <span className="mt-4 inline-block text-sm font-bold text-[#ff2442]">Shop marketplace →</span>
            </Link>

            <Link href="/" className="glass-hover glass rounded-3xl p-5">
              <span className="text-3xl">✨</span>
              <h2 className="mt-4 font-black text-[#1a1a1a]">Nairobi Home</h2>
              <p className="mt-1 text-sm leading-5 text-neutral-500">Return to the RedNote home feed and latest stories.</p>
              <span className="mt-4 inline-block text-sm font-bold text-[#ff2442]">Go home →</span>
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="glass-strong rounded-[2rem] p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#ff2442]">
              Discover
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#1a1a1a]">
              What&apos;s happening around Nairobi?
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Jump into the live feed to discover conversations, local recommendations and community posts.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ["🍽️", "Food", "/feed?category=Food"],
                ["📍", "Places", "/feed?category=Places"],
                ["🎉", "Events", "/feed?category=Events"],
                ["🛍️", "Shopping", "/feed?category=Shopping"],
              ].map(([icon, label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-full border border-white/80 bg-white/65 px-4 py-2 text-sm font-bold text-neutral-700 shadow-sm backdrop-blur-xl transition hover:border-[#ff2442]/20 hover:text-[#ff2442]"
                >
                  {icon} {label}
                </Link>
              ))}
            </div>

            <Link
              href="/feed"
              className="rednote-button mt-6 inline-flex rounded-full px-6 py-3 font-bold"
            >
              Discover Nairobi
            </Link>
          </div>

          <div className="glass-strong rounded-[2rem] p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#ff2442]">
              Quick access
            </p>
            <div className="mt-4 space-y-3">
              <Link href="/feed" className="glass-hover flex items-center justify-between rounded-2xl p-4">
                <span className="font-bold">Latest posts</span>
                <span>→</span>
              </Link>
              <Link href="/marketplace" className="glass-hover flex items-center justify-between rounded-2xl p-4">
                <span className="font-bold">Shop products</span>
                <span>→</span>
              </Link>
              <Link href="/" className="glass-hover flex items-center justify-between rounded-2xl p-4">
                <span className="font-bold">RedNote home</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
