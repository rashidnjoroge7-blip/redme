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
    <div className="glass-strong flex min-h-[60vh] flex-col overflow-hidden rounded-3xl">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-5 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="glass rounded-2xl px-6 py-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0f0] text-xl">
                💬
              </div>

              <p className="mt-3 text-sm font-semibold text-neutral-500">
                Start the conversation.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const ownMessage = message.sender_id === currentUserId;

            return (
              <div
                key={message.id}
                className={`flex ${
                  ownMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                    ownMessage
                      ? "rounded-br-lg bg-[#ff2442] text-white shadow-[#ff2442]/10"
                      : "rounded-bl-lg border border-white/70 bg-white/65 text-neutral-800 backdrop-blur-xl"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>

                  <div
                    className={`mt-1.5 text-[10px] ${
                      ownMessage ? "text-white/65" : "text-neutral-400"
                    }`}
                  >
                    {message.created_at
                      ? new Intl.DateTimeFormat("en-KE", {
                          timeStyle: "short",
                        }).format(new Date(message.created_at))
                      : ""}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={send}
        className="border-t border-white/60 bg-white/30 p-4 backdrop-blur-xl"
      >
        <div className="flex gap-2">
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={4000}
            placeholder="Write a message…"
            className="glass-input min-w-0 flex-1 rounded-full px-4 py-3 text-sm outline-none"
          />

          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="rednote-button rounded-full px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>

        {error && (
          <p className="glass-red mt-2 rounded-xl px-3 py-2 text-xs">{error}</p>
        )}
      </form>
    </div>
  );
}
