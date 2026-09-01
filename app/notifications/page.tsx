import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-black text-neutral-900">
            Notifications
          </h1>

          <p className="mt-4 text-sm text-neutral-600">
            Please sign in to view your notifications.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-[#ff2442] px-5 py-3 text-sm font-bold text-white"
          >
            Sign in
          </Link>
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
    <main className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-[#ff2442]">
          ← Home
        </Link>

        <div className="mt-5 flex items-center justify-between">
          <h1 className="text-2xl font-black text-neutral-900">
            Notifications
          </h1>

          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-500 shadow-sm">
            {notifications?.length ?? 0}
          </span>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-5 text-sm text-red-700">
            Unable to load your notifications.
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="mt-6 space-y-3">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-2xl border p-5 shadow-sm ${
                  notification.is_read
                    ? "border-neutral-200 bg-white"
                    : "border-[#ff2442]/20 bg-red-50/40"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-bold text-neutral-900">
                      {notification.title}
                    </h2>

                    {notification.message && (
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {notification.message}
                      </p>
                    )}
                  </div>

                  {!notification.is_read && (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff2442]" />
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
                  {notification.type && (
                    <span className="capitalize">{notification.type}</span>
                  )}

                  {notification.created_at && (
                    <>
                      <span>•</span>
                      <time dateTime={notification.created_at}>
                        {new Date(notification.created_at).toLocaleString()}
                      </time>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">🔔</div>

            <h2 className="mt-4 font-bold text-neutral-900">
              No notifications yet
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              You&apos;ll see activity and updates here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
