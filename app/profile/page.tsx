import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login?next=/profile");

  const [{ data: userData }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("id, full_name, username, avatar_url, bio, location").eq("id", userId).maybeSingle(),
  ]);

  return <main className="min-h-screen bg-neutral-50 px-4 py-10"><div className="mx-auto max-w-2xl"><Link href="/" className="text-sm font-semibold text-[#ff2442]">← Back to RedNote</Link><div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">Your profile</p><h1 className="mt-2 text-3xl font-black">Profile & settings</h1><p className="mt-2 text-sm text-neutral-500">Signed in as {userData?.user?.email ?? "your account"}.</p><div className="mt-8"><ProfileForm profile={profile} /></div></div></div></main>;
}
