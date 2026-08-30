import { createClient } from "@/lib/supabase/server";

export const FEED_CATEGORIES = [
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
] as const;

export type FeedPost = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  createdAt: string | null;
  userId: string | null;
  likesCount: number;
  commentsCount: number;
};

function numberValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function escapeIlike(value: string) {
  // PostgREST .or() uses a filter expression. Remove expression delimiters and
  // escape LIKE wildcards so user input cannot alter the filter grammar.
  return value.replace(/[\\%_(),]/g, (character) => `\\${character}`).slice(0, 100);
}

export async function getFeedPosts(options: {
  limit?: number;
  category?: string;
  search?: string;
} = {}) {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const category = options.category && options.category !== "All" ? options.category : null;
  const search = options.search?.trim() ?? "";

  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("id,user_id,title,description,category,image_url,likes_count,comments_count,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) query = query.eq("category", category);

  const safeSearch = escapeIlike(search);
  if (safeSearch) query = query.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);

  const { data, error } = await query;

  if (error) return { posts: [] as FeedPost[], error };

  const posts: FeedPost[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    userId: row.user_id,
    likesCount: numberValue(row.likes_count),
    commentsCount: numberValue(row.comments_count),
  }));

  return { posts, error: null };
}
