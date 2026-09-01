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
          className={`rounded-full border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
            liked
              ? "border-[#ff2442] bg-[#ff2442] text-white shadow-md shadow-[#ff2442]/20"
              : "border-white/70 bg-white/60 text-neutral-600 shadow-sm hover:border-[#ff2442]/20 hover:bg-[#fff0f0] hover:text-[#ff2442]"
          }`}
        >
          {liked ? "♥ Liked" : "♡ Like"} · {likes}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => toggle(`/api/posts/${postId}/save`, "saved")}
          aria-pressed={saved}
          className={`rounded-full border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
            saved
              ? "border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-md"
              : "border-white/70 bg-white/60 text-neutral-600 shadow-sm hover:border-[#1a1a1a]/15 hover:bg-white/80 hover:text-[#1a1a1a]"
          }`}
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      {message && (
        <p className="mt-2 rounded-xl bg-[#fff0f0]/80 px-3 py-2 text-xs font-medium text-[#ff2442] backdrop-blur-md">
          {message}
        </p>
      )}
    </div>
  );
}
