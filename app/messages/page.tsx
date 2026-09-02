import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login?next=/messages");
  }

  const { data, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id, joined_at, last_read_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#ff2442]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#ff6b81]/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-bold text-[#ff2442] shadow-sm backdrop-blur-xl transition hover:bg-[#fff0f0]"
        >
          ← RedNote
        </Link>

        <div className="glass-strong mt-6 rounded-3xl p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">
            RedNote
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#1a1a1a]">Messages</h1>

          <p className="mt-1 text-sm text-neutral-500">
            Your private conversations.
          </p>

          {error ? (
            <div className="glass-red mt-6 rounded-2xl p-5 text-sm">
              Unable to load conversations.
            </div>
          ) : data?.length ? (
            <div className="mt-6 space-y-3">
              {data.map((conversation) => (
                <Link
                  key={conversation.conversation_id}
                  href={`/messages/${conversation.conversation_id}`}
                  className="glass glass-hover block rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f0] text-lg">
                      💬
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-[#1a1a1a]">Conversation</p>

                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {conversation.conversation_id}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass mt-6 rounded-2xl p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0f0] text-2xl">
                💬
              </div>

              <p className="mt-4 text-sm font-semibold text-neutral-500">
                No conversations yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
