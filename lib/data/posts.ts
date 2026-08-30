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

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) query = query.eq("category", category);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  const { data, error } = await query;

  if (error) return { posts: [] as FeedPost[], error };

  const posts: FeedPost[] = (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id ?? crypto.randomUUID()),
    title: String(row.title ?? "Untitled post"),
    description: typeof row.description === "string" ? row.description : null,
    category: String(row.category ?? "Other"),
    imageUrl:
      typeof row.image_url === "string"
        ? row.image_url
        : typeof row.imageurl === "string"
          ? row.imageurl
          : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    userId:
      typeof row.user_id === "string"
        ? row.user_id
        : typeof row.userid === "string"
          ? row.userid
          : null,
    likesCount: numberValue(row.likes_count ?? row.like_count),
    commentsCount: numberValue(row.comments_count ?? row.comment_count),
  }));

  return { posts, error: null };
}
