"use client";

import { useState } from "react";

export function PostActions({
  postId,
  initialLikes,
}: {
  postId: string;
  initialLikes: number;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle(path: string, key: "liked" | "saved") {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(path, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "Please log in to use this action.");
        return;
      }
      const value = Boolean(data[key]);
      if (key === "liked") {
        setLiked(value);
        setLikes((current) => current + (value ? 1 : -1));
      } else {
        setSaved(value);
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => toggle(`/api/posts/${postId}/like`, "liked")}
          aria-pressed={liked}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${liked ? "bg-[#ff2442] text-white" : "bg-neutral-100 text-neutral-600"}`}
        >
          {liked ? "♥ Liked" : "♡ Like"} · {likes}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => toggle(`/api/posts/${postId}/save`, "saved")}
          aria-pressed={saved}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${saved ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-red-600">{message}</p>}
    </div>
  );
}
