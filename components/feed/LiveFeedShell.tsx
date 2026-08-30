"use client";

import type { FeedPost } from "@/lib/data/posts";
import { FEED_CATEGORIES } from "@/lib/data/posts";

function formatDate(value: string | null) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(date);
}

export function LiveFeedShell({
  posts,
  error,
  activeCategory,
  search,
}: {
  posts: FeedPost[];
  error: boolean;
  activeCategory: string;
  search: string;
}) {
  return (
    <section>
      <div className="sticky top-0 z-20 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
          {FEED_CATEGORIES.map((item) => {
            const href = item === "All"
              ? `/feed${search ? `?q=${encodeURIComponent(search)}` : ""}`
              : `/feed?category=${encodeURIComponent(item)}${search ? `&q=${encodeURIComponent(search)}` : ""}`;

            return (
              <a
                key={item}
                href={href}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeCategory === item ? "bg-[#ff2442] text-white" : "bg-neutral-100 text-neutral-600"}`}
              >
                {item}
              </a>
            );
          })}
        </div>
      </div>

      {search && (
        <div className="mx-auto max-w-6xl px-4 pt-5 text-sm text-neutral-500">
          Results for <span className="font-semibold text-neutral-800">“{search}”</span>
          {activeCategory !== "All" && <> in <span className="font-semibold text-neutral-800">{activeCategory}</span></>}
        </div>
      )}

      {error ? (
        <div className="mx-4 my-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          The RedNote feed is temporarily unavailable. Please try again shortly.
        </div>
      ) : posts.length === 0 ? (
        <div className="mx-4 my-6 rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-neutral-500">
          No posts found. Try another category or search term.
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => (
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
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                  <span>{formatDate(post.createdAt)}</span>
                  <span>{post.likesCount} likes · {post.commentsCount} comments</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
