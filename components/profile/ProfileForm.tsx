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
    body: JSON.stringify({
      full_name: fullName,
      username,
      bio,
      location,
      avatar_url: avatarUrl,
      avatar_path: avatarPath || undefined,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "Unable to save your profile.");
  }

  setStatus("Profile saved successfully.");
} catch (error) {
  setStatus(
    error instanceof Error
      ? error.message
      : "Unable to save your profile.",
  );
} finally {
  setSaving(false);
}

}

return ( <form onSubmit={saveProfile} className="space-y-6"> <div className="grid gap-5 sm:grid-cols-2"> <Field label="Full name">
<input
value={fullName}
onChange={(e) => setFullName(e.target.value)}
maxLength={100}
className="field"
/> </Field>

    <Field label="Username">
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        maxLength={30}
        placeholder="e.g. nairobifoodie"
        className="field"
      />
    </Field>
  </div>

  <Field label="Location">
    <input
      value={location}
      onChange={(e) => setLocation(e.target.value)}
      maxLength={100}
      placeholder="Nairobi, Kenya"
      className="field"
    />
  </Field>

  <div className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-[0_12px_40px_rgba(255,36,66,0.06)] backdrop-blur-xl">
    <p className="mb-4 text-sm font-bold text-neutral-900">
      Profile photo
    </p>

    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Current profile"
          className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg ring-1 ring-[#ff2442]/10"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-[#ff2442] to-[#ff6b81] text-2xl font-black text-white shadow-lg">
          {(fullName.charAt(0) || "R").toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <ImageUploader
          bucket="avatars"
          onUploaded={(url, path) => {
            setAvatarUrl(url);
            setAvatarPath(path);
            setStatus("Photo uploaded. Save your profile to apply it.");
          }}
        />
      </div>
    </div>
  </div>

  <Field label="Bio">
    <textarea
      value={bio}
      onChange={(e) => setBio(e.target.value)}
      maxLength={500}
      rows={5}
      placeholder="Tell the RedNote community a little about yourself..."
      className="field resize-none"
    />
    <p className="mt-1.5 text-right text-xs text-neutral-400">
      {bio.length}/500
    </p>
  </Field>

  <div className="flex flex-col gap-3 border-t border-black/5 pt-5 sm:flex-row sm:items-center">
    <button
      type="submit"
      disabled={saving}
      className="rounded-full bg-[#ff2442] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#ff2442]/20 transition hover:-translate-y-0.5 hover:bg-[#e91f3d] hover:shadow-xl hover:shadow-[#ff2442]/25 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {saving ? "Saving..." : "Save profile"}
    </button>

    {status && (
      <p
        role="status"
        className={`rounded-full px-4 py-2 text-sm ${
          status.includes("successfully") || status.includes("uploaded")
            ? "bg-[#fff0f0] text-[#ff2442]"
            : "bg-red-50 text-red-600"
        }`}
      >
        {status}
      </p>
    )}
  </div>
</form>

);
}

function Field({
label,
children,
}: {
label: string;
children: React.ReactNode;
}) {
return ( <label className="block text-sm font-semibold text-neutral-800"> <span className="mb-2 block">{label}</span>
{children} </label>
);
}
