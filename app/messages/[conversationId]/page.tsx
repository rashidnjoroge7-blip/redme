import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MessageThread } from "@/components/messages/MessageThread";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect(`/login?next=/messages/${conversationId}`);

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!participant) notFound();

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at, edited_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  return <main className="min-h-screen bg-neutral-50 px-4 py-8"><div className="mx-auto max-w-2xl"><a href="/messages" className="text-sm font-semibold text-[#ff2442]">← Messages</a><h1 className="mt-5 text-2xl font-black">Conversation</h1>{error ? <p className="mt-5 rounded-2xl bg-red-50 p-5 text-sm text-red-700">Unable to load messages.</p> : <div className="mt-5"><MessageThread conversationId={conversationId} currentUserId={userId} initial={messages ?? []} /></div>}</div></main>;
}
