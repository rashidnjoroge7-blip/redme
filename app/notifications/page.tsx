import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-8 sm:py-10">
        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#ff2442]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#ff6b81]/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-2xl">
          <Link
            href="/"
            className="glass-hover inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-[#ff2442]"
          >
            ← RedNote
          </Link>

          <div className="glass-strong mt-5 rounded-3xl p-6 sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0f0] text-2xl">
              🔔
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#ff2442]">
              RedNote
            </p>

            <h1 className="mt-2 text-3xl font-black text-[#1a1a1a]">
              Notifications
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Please sign in to view your notifications.
            </p>

            <Link
              href="/login"
              className="rednote-button mt-6 inline-flex items-center rounded-full px-5 py-3 text-sm font-bold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, user_id, title, message, type, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#ff2442]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-[#ff6b81]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-[#fff0f0] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <Link
          href="/"
          className="glass-hover inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-[#ff2442]"
        >
          ← RedNote
        </Link>

        <div className="glass-strong mt-5 rounded-3xl p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff2442]">
                RedNote
              </p>

              <h1 className="mt-2 text-3xl font-black text-[#1a1a1a]">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-neutral-500">
                Activity and updates from your RedNote account.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff0f0] text-xl">
              🔔
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/45 px-4 py-3">
            <span className="text-sm font-semibold text-neutral-600">
              All notifications
            </span>

            <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-xs font-bold text-[#ff2442]">
              {notifications?.length ?? 0}
            </span>
          </div>

          {error ? (
            <div className="glass-red mt-4 rounded-2xl p-5 text-sm">
              <p className="font-bold text-[#1a1a1a]">
                Unable to load your notifications.
              </p>

              <p className="mt-1 text-neutral-500">
                Please try again in a moment.
              </p>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="mt-4 space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`glass glass-hover rounded-3xl p-5 ${
                    notification.is_read ? "" : "ring-1 ring-[#ff2442]/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${
                        notification.is_read ? "bg-white/60" : "bg-[#fff0f0]"
                      }`}
                    >
                      {notification.is_read ? "•" : "🔔"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-bold text-[#1a1a1a]">
                          {notification.title}
                        </h2>

                        {!notification.is_read && (
                          <span
                            aria-label="Unread notification"
                            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff2442]"
                          />
                        )}
                      </div>

                      {notification.message && (
                        <p className="mt-2 text-sm leading-6 text-neutral-600">
                          {notification.message}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                        {notification.type && (
                          <span className="rounded-full bg-white/55 px-2.5 py-1 font-semibold capitalize text-neutral-500">
                            {notification.type}
                          </span>
                        )}

                        {notification.created_at && (
                          <time dateTime={notification.created_at}>
                            {new Date(notification.created_at).toLocaleString()}
                          </time>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="glass mt-4 rounded-3xl p-8 text-center sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0f0] text-2xl">
                🔔
              </div>

              <h2 className="mt-4 font-bold text-[#1a1a1a]">
                No notifications yet
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                You&apos;ll see activity and updates here.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
