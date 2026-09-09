"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

type RpcClient = {
  rpc: (
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: string | null; error: { message: string } | null }>;
};

export async function moderatePost(formData: FormData) {
  await requireAdmin();

  const postId = String(formData.get("postId") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!postId) {
    throw new Error("Post ID is required.");
  }

  if (action !== "hide" && action !== "restore") {
    throw new Error("Unsupported moderation action.");
  }

  if (reason.length > 1000) {
    throw new Error("Moderation reason must be 1000 characters or fewer.");
  }

  const supabase = await createClient();
  const client = supabase as unknown as RpcClient;
  const { data, error } = await client.rpc("moderate_post", {
    p_post_id: postId,
    p_action: action,
    p_reason: reason || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data === "ALREADY_HIDDEN" || data === "ALREADY_PUBLISHED") {
    revalidatePath(`/admin/posts/${postId}`);
    revalidatePath("/admin/posts");
    return;
  }

  if (data !== "HIDDEN" && data !== "RESTORED") {
    throw new Error("The moderation operation returned an unexpected result.");
  }

  revalidatePath(`/admin/posts/${postId}`);
  revalidatePath("/admin/posts");
}
