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
  return value
    .replace(/[\\%_(),]/g, (character) => `\\${character}`)
    .slice(0, 100);
}

function normalizeCategory(value: string | undefined) {
  const category = value?.trim() ?? "";
  return category && category.toLowerCase() !== "all" ? category : null;
}

export async function getFeedPosts(
  options: {
    limit?: number;
    category?: string;
    search?: string;
  } = {},
) {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const category = normalizeCategory(options.category);
  const search = options.search?.trim().slice(0, 100) ?? "";

  const supabase = await createClient();

  let rows: Array<{
    id: string;
    user_id: string | null;
    title: string;
    description: string | null;
    category: string;
    image_url: string | null;
    likes_count: number | null;
    created_at: string | null;
  }> = [];

  if (search) {
    // Prefer the indexed PostgreSQL search function. The fallback keeps the
    // application compatible while migration 0018 is being deployed.
    const { data: searchRows, error: searchError } = await supabase.rpc(
      "search_posts",
      {
        search_text: search,
        category_filter: category ?? undefined,
        result_limit: limit,
      },
    );

    if (!searchError && searchRows) {
      rows = searchRows;
    } else {
      let fallbackQuery = supabase
        .from("posts")
        .select(
          "id,user_id,title,description,category,image_url,likes_count,created_at",
        )
        .or(
          `title.ilike.%${escapeIlike(search)}%,description.ilike.%${escapeIlike(search)}%,category.ilike.%${escapeIlike(search)}%`,
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (category) {
        fallbackQuery = fallbackQuery.ilike("category", category);
      }

      const { data, error } = await fallbackQuery;
      if (error) {
        return { posts: [] as FeedPost[], error };
      }
      rows = data ?? [];
    }
  } else {
    let query = supabase
      .from("posts")
      .select(
        "id,user_id,title,description,category,image_url,likes_count,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) {
      query = query.ilike("category", category);
    }

    const { data, error } = await query;
    if (error) {
      return { posts: [] as FeedPost[], error };
    }
    rows = data ?? [];
  }

  const posts: FeedPost[] = await Promise.all(
    rows.map(async (row) => {
      const { count } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", row.id);

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        imageUrl: row.image_url,
        createdAt: row.created_at,
        userId: row.user_id,
        likesCount: numberValue(row.likes_count),
        commentsCount: count ?? 0,
      };
    }),
  );

  return {
    posts,
    error: null,
  };
}
