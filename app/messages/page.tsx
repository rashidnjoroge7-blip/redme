import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login?next=/messages");

  const { data, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id, joined_at, last_read_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  return <main className="min-h-screen bg-neutral-50 px-4 py-10"><div className="mx-auto max-w-2xl"><a href="/" className="text-sm font-semibold text-[#ff2442]">← RedNote</a><h1 className="mt-6 text-3xl font-black">Messages</h1><p className="mt-1 text-sm text-neutral-500">Your private conversations.</p>{error ? <p className="mt-6 rounded-2xl bg-red-50 p-5 text-sm text-red-700">Unable to load conversations.</p> : data?.length ? <div className="mt-6 space-y-3">{data.map((conversation) => <a key={conversation.conversation_id} href={`/messages/${conversation.conversation_id}`} className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 hover:ring-[#ff2442]/30"><p className="font-bold">Conversation</p><p className="mt-1 text-xs text-neutral-500">{conversation.conversation_id}</p></a>)}</div> : <div className="mt-6 rounded-2xl bg-white p-8 text-center text-sm text-neutral-500 shadow-sm ring-1 ring-black/5">No conversations yet.</div>}</div></main>;
}
