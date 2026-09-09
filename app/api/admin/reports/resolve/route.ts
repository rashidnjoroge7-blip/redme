import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: string | null; error: { message: string } | null }> };

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { reportId?: unknown; status?: unknown; resolution?: unknown };
    const reportId = String(body.reportId ?? "").trim();
    const status = String(body.status ?? "").trim();
    const resolution = String(body.resolution ?? "").trim();
    if (!reportId) return NextResponse.json({ error: "Report ID is required." }, { status: 400 });
    if (!["under_review", "resolved", "dismissed"].includes(status)) return NextResponse.json({ error: "Unsupported report status." }, { status: 400 });
    if (resolution.length > 1000) return NextResponse.json({ error: "Resolution must be 1000 characters or fewer." }, { status: 400 });
    const supabase = await createClient();
    const client = supabase as unknown as RpcClient;
    const { data, error } = await client.rpc("resolve_post_report", { p_report_id: reportId, p_status: status, p_resolution: resolution || null });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    revalidatePath("/admin/reports");
    revalidatePath(`/admin/reports/${reportId}`);
    return NextResponse.json({ ok: true, result: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Report update failed." }, { status: 500 });
  }
}
