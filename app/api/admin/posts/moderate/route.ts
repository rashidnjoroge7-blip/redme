import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

type RpcClient = {
  rpc: (
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: string | null; error: { message: string } | null }>;
};

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as {
      postId?: unknown;
      action?: unknown;
      reason?: unknown;
    };

    const postId = String(body.postId ?? "").trim();
    const action = String(body.action ?? "").trim();
    const reason = String(body.reason ?? "").trim();

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    }

    if (action !== "hide" && action !== "restore") {
      return NextResponse.json({ error: "Unsupported moderation action." }, { status: 400 });
    }

    if (reason.length > 1000) {
      return NextResponse.json(
        { error: "Moderation reason must be 1000 characters or fewer." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const client = supabase as unknown as RpcClient;
    const { data, error } = await client.rpc("moderate_post", {
      p_post_id: postId,
      p_action: action,
      p_reason: reason || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!["HIDDEN", "RESTORED", "ALREADY_HIDDEN", "ALREADY_PUBLISHED"].includes(data ?? "")) {
      return NextResponse.json(
        { error: "The moderation operation returned an unexpected result." },
        { status: 500 },
      );
    }

    revalidatePath(`/admin/posts/${postId}`);
    revalidatePath("/admin/posts");

    return NextResponse.json({ ok: true, result: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Moderation request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
