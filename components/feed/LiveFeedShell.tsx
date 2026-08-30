"use client";

import { useMemo, useState } from "react";
import type { FeedPost } from "@/lib/data/posts";

const categories = ["All", "Food", "Fashion", "Travel", "Home", "Nature", "Pets", "Books", "Beauty", "Fitness"];

function formatDate(value: string | null) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(date);
}

export function LiveFeedShell({ posts, error }: { posts: FeedPost[]; error: boolean }) {
  const [category, setCategory] = useState("All");
  const filteredPosts = useMemo(
    () => category === "All" ? posts : posts.filter((post) => post.category === category),
    [category, posts],
  );

  return (
    <section>
      <div className="sticky top-0 z-20 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${category === item ? "bg-[#ff2442] text-white" : "bg-neutral-100 text-neutral-600"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mx-4 my-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          The RedNote feed is temporarily unavailable. Please try again shortly.
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="mx-4 my-6 rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-neutral-500">
          No posts found in this category yet.
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredPosts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
              {post.imageUrl ? (
                <img src={post.imageUrl} alt={post.title} className="aspect-[4/5] w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-[#fff0f0] to-neutral-100 text-5xl">🇰🇪</div>
              )}
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#ff2442]">{post.category}</p>
                <h2 className="mt-1 font-bold">{post.title}</h2>
                {post.description && <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{post.description}</p>}
                <p className="mt-3 text-xs text-neutral-500">{formatDate(post.createdAt)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
