"use client";

const categories = ["All", "Food", "Fashion", "Travel", "Home", "Nature", "Pets", "Books", "Beauty", "Fitness"];

const demoPosts = [
  { title: "Best coffee spots in Nairobi", category: "Food", author: "RedNote", emoji: "☕" },
  { title: "Weekend style from Westlands", category: "Fashion", author: "RedNote", emoji: "👗" },
  { title: "A quiet escape near Karen", category: "Travel", author: "RedNote", emoji: "🌿" },
  { title: "Kenyan artisan finds", category: "Home", author: "RedNote", emoji: "🧺" },
];

export function FeedShell() {
  return (
    <section>
      <div className="sticky top-0 z-20 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
          {categories.map((category, index) => (
            <button key={category} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${index === 0 ? "bg-[#ff2442] text-white" : "bg-neutral-100 text-neutral-600"}`}>
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {demoPosts.map((post) => (
          <article key={post.title} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-[#fff0f0] to-neutral-100 text-6xl">{post.emoji}</div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#ff2442]">{post.category}</p>
              <h2 className="mt-1 font-bold">{post.title}</h2>
              <p className="mt-3 text-xs text-neutral-500">By {post.author}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
