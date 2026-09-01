"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  actor_id: string | null;
  type: "like" | "comment" | "follow" | "system";
  post_id: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
};

export function NotificationCenter({ initial }: { initial: Notification[] }) {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;

    async function subscribe() {
      const { data } = await supabase.auth.getUser();

      if (!active || !data.user) return;

      channel = supabase
        .channel(`notifications:${data.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${data.user.id}`,
          },
          (payload) => {
            const notification = payload.new as Notification;

            setItems((current) => [notification, ...current].slice(0, 50));
          },
        )
        .subscribe();
    }

    void subscribe();

    return () => {
      active = false;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  async function markRead(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              read_at: new Date().toISOString(),
            }
          : item,
      ),
    );

    await fetch("/api/notifications/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId: id,
      }),
    });
  }

  const unread = items.filter((item) => !item.read_at).length;

  return (
    <section className="glass-strong rounded-3xl p-5 sm:p-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1a1a1a]">Notifications</h1>

          <p className="mt-1 text-sm text-neutral-500">{unread} unread</p>
        </div>

        <span className="rounded-full border border-[#ff2442]/10 bg-[#fff0f0]/70 px-3 py-1 text-xs font-bold text-[#ff2442] backdrop-blur-md">
          Live
        </span>
      </div>

      {/* Notifications */}
      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0f0] text-2xl">
              🔔
            </div>

            <p className="mt-4 text-sm font-semibold text-neutral-600">
              You&apos;re all caught up.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => !item.read_at && markRead(item.id)}
              className={`glass group block w-full rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                item.read_at
                  ? "opacity-60 hover:opacity-80"
                  : "hover:border-[#ff2442]/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    item.read_at
                      ? "bg-neutral-300"
                      : "bg-[#ff2442] shadow-sm shadow-[#ff2442]/30"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-6 text-[#1a1a1a]">
                    {item.message}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <span className="capitalize">{item.type}</span>

                    <span className="text-neutral-300">•</span>

                    <time dateTime={item.created_at}>
                      {new Intl.DateTimeFormat("en-KE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.created_at))}
                    </time>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
