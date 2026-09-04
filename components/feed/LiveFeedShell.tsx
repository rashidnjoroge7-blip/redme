"use client";

import Image from "next/image";

import type { FeedPost } from "@/lib/data/posts";
import { FEED_CATEGORIES } from "@/lib/data/feed";
import { PostActions } from "@/components/feed/PostActions";

function formatDate(value: string | null) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(date);
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
    <section className="min-h-screen">
      {/* Category navigation */}
      <div className="glass sticky top-0 z-20 border-x-0 border-t-0 px-4 py-3">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FEED_CATEGORIES.map((item) => {
            const href =
              item === "All"
                ? `/feed${search ? `?q=${encodeURIComponent(search)}` : ""}`
                : `/feed?category=${encodeURIComponent(item)}${
                    search ? `&q=${encodeURIComponent(search)}` : ""
                  }`;

            return (
              <a
                key={item}
                href={href}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  activeCategory === item
                    ? "border-[#ff2442] bg-[#ff2442] text-white shadow-lg shadow-[#ff2442]/20"
                    : "border-white/70 bg-white/55 text-neutral-600 backdrop-blur-md hover:border-[#ff2442]/20 hover:bg-[#fff0f0] hover:text-[#ff2442]"
                }`}
              >
                {item}
              </a>
            );
          })}
        </div>
      </div>

      {/* Search information */}
      {search && (
        <div className="mx-auto max-w-6xl px-4 pt-5 text-sm text-neutral-500">
          Results for{" "}
          <span className="font-semibold text-neutral-800">â€œ{search}â€</span>
          {activeCategory !== "All" && (
            <>
              {" "}
              in{" "}
              <span className="font-semibold text-neutral-800">
                {activeCategory}
              </span>
            </>
          )}
        </div>
      )}

      {/* Feed content */}
      {error ? (
        <div className="glass-red mx-4 my-6 rounded-3xl p-5 text-sm text-[#ff2442]">
          The RedNote feed is temporarily unavailable. Please try again shortly.
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-strong mx-4 my-6 rounded-3xl p-8 text-center text-sm text-neutral-500">
          No posts found. Try another category or search term.
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="glass glass-hover group overflow-hidden rounded-3xl"
            >
              {/* Post image */}
              {post.imageUrl ? (
                <div className="relative overflow-hidden">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/15 via-transparent to-white/15" />
                </div>
              ) : (
                <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff0f0] via-white to-[#fff0f0] text-5xl">
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
                  <span className="relative">ðŸ‡°ðŸ‡ª</span>
                </div>
              )}

              {/* Post details */}
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff2442]">
                  {post.category}
                </p>

                <h2 className="mt-2 font-bold leading-snug text-[#1a1a1a]">
                  {post.title}
                </h2>

                {post.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                    {post.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                  <span>{formatDate(post.createdAt)}</span>

                  <span>
                    {post.commentsCount}{" "}
                    {post.commentsCount === 1 ? "comment" : "comments"}
                  </span>
                </div>

                <PostActions postId={post.id} initialLikes={post.likesCount} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
