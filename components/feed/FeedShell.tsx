"use client";

const categories = [
  "All",
  "Food",
  "Fashion",
  "Travel",
  "Home",
  "Nature",
  "Pets",
  "Books",
  "Beauty",
  "Fitness",
];

const demoPosts = [
  {
    title: "Best coffee spots in Nairobi",
    category: "Food",
    author: "RedNote",
    emoji: "☕",
  },
  {
    title: "Weekend style from Westlands",
    category: "Fashion",
    author: "RedNote",
    emoji: "👗",
  },
  {
    title: "A quiet escape near Karen",
    category: "Travel",
    author: "RedNote",
    emoji: "🌿",
  },
  {
    title: "Kenyan artisan finds",
    category: "Home",
    author: "RedNote",
    emoji: "🧺",
  },
];

export function FeedShell() {
  return (
    <section className="min-h-screen">
      {/* Category navigation */}
      <div className="sticky top-0 z-20 border-b border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category, index) => (
            <button
              key={category}
              type="button"
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                index === 0
                  ? "border-[#ff2442] bg-[#ff2442] text-white shadow-lg shadow-[#ff2442]/20"
                  : "border-white/70 bg-white/55 text-neutral-600 backdrop-blur-md hover:border-[#ff2442]/20 hover:bg-[#fff0f0] hover:text-[#ff2442]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Feed cards */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {demoPosts.map((post) => (
          <article
            key={post.title}
            className="group overflow-hidden rounded-3xl border border-white/70 bg-white/65 shadow-[0_10px_35px_rgb(26_26_26/7%)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#ff2442]/15 hover:shadow-[0_18px_45px_rgb(26_26_26/11%)]"
          >
            <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff0f0] via-white to-[#fff0f0] text-6xl transition-transform duration-500 group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
              <span className="relative drop-shadow-sm">{post.emoji}</span>
            </div>

            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff2442]">
                {post.category}
              </p>

              <h2 className="mt-2 text-base font-bold leading-snug text-[#1a1a1a]">
                {post.title}
              </h2>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  By{" "}
                  <span className="font-semibold text-neutral-700">
                    {post.author}
                  </span>
                </p>

                <span className="h-2 w-2 rounded-full bg-[#ff6b81]" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
