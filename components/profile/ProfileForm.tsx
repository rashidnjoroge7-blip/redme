"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setStatus("Your session has expired. Please log in again.");
      setSaving(false);
      return;
    }

    const values = {
      id: authData.user.id,
      full_name: fullName.trim().slice(0, 100) || null,
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30) || null,
      bio: bio.trim().slice(0, 500) || null,
      location: location.trim().slice(0, 100) || null,
      avatar_url: avatarUrl.trim().slice(0, 2048) || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(values, { onConflict: "id" });
    setSaving(false);

    if (error) {
      setStatus(error.code === "23505" ? "That username is already taken." : "Unable to save your profile.");
      return;
    }

    setStatus("Profile saved.");
  }

  return (
    <form onSubmit={saveProfile} className="space-y-5">
      <Field label="Full name"><input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} className="field" /></Field>
      <Field label="Username"><input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} placeholder="e.g. nairobifoodie" className="field" /></Field>
      <Field label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} placeholder="Nairobi, Kenya" className="field" /></Field>
      <Field label="Avatar URL"><input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} maxLength={2048} placeholder="https://..." className="field" /></Field>
      <Field label="Bio"><textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={4} className="field resize-none" /></Field>
      <button disabled={saving} className="rounded-full bg-[#ff2442] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save profile"}</button>
      {status && <p role="status" className="text-sm text-neutral-600">{status}</p>}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-neutral-800"><span className="mb-2 block">{label}</span>{children}</label>;
}
