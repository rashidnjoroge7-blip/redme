import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login?next=/notifications");

  const { data, error } = await supabase.from("notifications").select("id, actor_id, type, post_id, message, read_at, created_at").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(50);

  return <main className="min-h-screen bg-neutral-50 px-4 py-10"><div className="mx-auto max-w-2xl"><Link href="/" className="text-sm font-semibold text-[#ff2442]">← RedNote</Link><div className="mt-6">{error ? <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-700">Unable to load notifications.</div> : <NotificationCenter initial={data ?? []} />}</div></div></main>;
}
