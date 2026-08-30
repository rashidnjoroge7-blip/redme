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
      channel = supabase.channel(`notifications:${data.user.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${data.user.id}` }, (payload) => {
        const notification = payload.new as Notification;
        setItems((current) => [notification, ...current].slice(0, 50));
      }).subscribe();
    }

    void subscribe();
    return () => { active = false; if (channel) void supabase.removeChannel(channel); };
  }, []);

  async function markRead(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
    await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
  }

  const unread = items.filter((item) => !item.read_at).length;

  return <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-black">Notifications</h1><p className="text-sm text-neutral-500">{unread} unread</p></div><span className="rounded-full bg-[#fff0f0] px-3 py-1 text-xs font-bold text-[#ff2442]">Live</span></div><div className="mt-5 divide-y divide-neutral-100">{items.length === 0 ? <p className="py-8 text-center text-sm text-neutral-500">You&apos;re all caught up.</p> : items.map((item) => <button key={item.id} type="button" onClick={() => !item.read_at && markRead(item.id)} className={`block w-full px-2 py-4 text-left ${item.read_at ? "opacity-60" : ""}`}><div className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff2442]" /><div><p className="text-sm font-semibold">{item.message}</p><p className="mt-1 text-xs text-neutral-500">{new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</p></div></div></button>)}</div></section>;
}
