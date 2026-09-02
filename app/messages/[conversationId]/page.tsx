import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageThread } from "@/components/messages/MessageThread";
import { createClient } from "@/lib/supabase/server";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect(`/login?next=/messages/${conversationId}`);
  }

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!participant) {
    notFound();
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at, is_read")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#ff2442]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-[#ff6b81]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-[#fff0f0] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <Link
          href="/messages"
          className="glass-hover inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-[#ff2442]"
        >
          ← Messages
        </Link>

        <div className="glass-strong mt-5 rounded-3xl p-5 sm:p-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff0f0] text-xl">
              💬
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff2442]">
                RedNote
              </p>

              <h1 className="mt-1 text-2xl font-black text-[#1a1a1a]">
                Conversation
              </h1>

              <p className="mt-1 truncate text-xs text-neutral-500">
                {conversationId}
              </p>
            </div>
          </div>

          {error ? (
            <div className="glass-red mt-6 rounded-2xl p-5 text-sm">
              <p className="font-bold text-[#1a1a1a]">
                Unable to load messages.
              </p>

              <p className="mt-1 text-neutral-500">
                Please try again in a moment.
              </p>
            </div>
          ) : (
            <div className="glass mt-6 rounded-3xl p-3 sm:p-5">
              <MessageThread
                conversationId={conversationId}
                currentUserId={userId}
                initial={messages ?? []}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
