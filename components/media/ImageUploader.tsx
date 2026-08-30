"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX = { avatars: 5 * 1024 * 1024, "post-media": 10 * 1024 * 1024, "product-media": 10 * 1024 * 1024 } as const;
type Bucket = keyof typeof MAX;

export function ImageUploader({ bucket, onUploaded }: { bucket: Bucket; onUploaded: (url: string, path: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type) || file.size > MAX[bucket]) {
      setError("Use JPEG, PNG or WebP within the allowed size limit.");
      return;
    }
    setBusy(true);
    try {
      const sign = await fetch("/api/storage/sign-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bucket, fileName: file.name, contentType: file.type, size: file.size }) });
      const signed = await sign.json();
      if (!sign.ok) throw new Error(signed.error ?? "Unable to prepare upload.");
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from(bucket).uploadToSignedUrl(signed.path, signed.token, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(bucket).getPublicUrl(signed.path);
      onUploaded(data.publicUrl, signed.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  return <div><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); e.currentTarget.value = ""; }} /><button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Uploading…" : "Upload image"}</button>{error && <p className="mt-2 text-xs text-red-600">{error}</p>}</div>;
}
