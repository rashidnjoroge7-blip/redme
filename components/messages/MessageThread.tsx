"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string | null;
  is_read: boolean | null;
};

export function MessageThread({
  conversationId,
  currentUserId,
  initial,
}: {
  conversationId: string;
  currentUserId: string;
  initial: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as Message;

          setMessages((current) =>
            current.some((item) => item.id === message.id)
              ? current
              : [...current, message],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = body.trim();

    if (!content || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: content,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Unable to send message.",
        );
        return;
      }

      if (data.message) {
        const message = data.message as Message;

        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
        );
      }

      setBody("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">
            Start the conversation.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUserId
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.sender_id === currentUserId
                    ? "bg-[#ff2442] text-white"
                    : "bg-neutral-100 text-neutral-800"
                }`}
              >
                {message.content}

                <div className="mt-1 text-[10px] opacity-60">
                  {message.created_at
                    ? new Intl.DateTimeFormat("en-KE", {
                        timeStyle: "short",
                      }).format(new Date(message.created_at))
                    : ""}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="border-t border-neutral-100 p-4">
        <div className="flex gap-2">
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={4000}
            placeholder="Write a message…"
            className="min-w-0 flex-1 rounded-full bg-neutral-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#ff2442]/30"
          />

          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="rounded-full bg-[#ff2442] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
