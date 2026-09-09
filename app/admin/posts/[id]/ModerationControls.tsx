"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ModerationControlsProps = {
  postId: string;
  status: "published" | "hidden";
};

export default function ModerationControls({ postId, status }: ModerationControlsProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const action = status === "hidden" ? "restore" : "hide";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/posts/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action, reason }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; result?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || `Moderation request failed (${response.status}).`);
      }

      setReason("");
      setMessage(action === "hide" ? "Post hidden successfully." : "Post restored successfully.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Moderation request failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <label className="block">
        <span className="text-sm font-bold">Reason (optional)</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Explain why this post is being hidden or restored…"
          className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#ff2442]"
          disabled={pending}
        />
      </label>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}

      <button
        name="action"
        value={action}
        type="submit"
        disabled={pending}
        className={`rounded-xl px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
          action === "hide" ? "bg-[#ff2442]" : "bg-emerald-600"
        }`}
      >
        {pending ? "Saving…" : action === "hide" ? "Hide post" : "Restore post"}
      </button>
    </form>
  );
}
