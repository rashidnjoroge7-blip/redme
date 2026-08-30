import { createClient } from "@/lib/supabase/server";

export type FeedPost = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  createdAt: string | null;
  userId: string | null;
};

export async function getFeedPosts(limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { posts: [] as FeedPost[], error };
  }

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
  }));

  return { posts, error: null };
}
