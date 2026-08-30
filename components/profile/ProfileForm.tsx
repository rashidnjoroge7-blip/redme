"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/media/ImageUploader";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
} | null;

export function ProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [avatarPath, setAvatarPath] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, username, bio, location, avatar_url: avatarUrl, avatar_path: avatarPath || undefined }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save your profile.");
      setStatus("Profile saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save your profile.");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={saveProfile} className="space-y-5">
      <Field label="Full name"><input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} className="field" /></Field>
      <Field label="Username"><input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} placeholder="e.g. nairobifoodie" className="field" /></Field>
      <Field label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} placeholder="Nairobi, Kenya" className="field" /></Field>
      <div>
        <p className="mb-2 text-sm font-semibold text-neutral-800">Profile photo</p>
        {avatarUrl && <img src={avatarUrl} alt="Current profile" className="mb-3 h-20 w-20 rounded-full object-cover" />}
        <ImageUploader bucket="avatars" onUploaded={(url, path) => { setAvatarUrl(url); setAvatarPath(path); setStatus("Photo uploaded. Save your profile to apply it."); }} />
      </div>
      <Field label="Bio"><textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={4} className="field resize-none" /></Field>
      <button disabled={saving} className="rounded-full bg-[#ff2442] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save profile"}</button>
      {status && <p role="status" className="text-sm text-neutral-600">{status}</p>}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-neutral-800"><span className="mb-2 block">{label}</span>{children}</label>;
}
