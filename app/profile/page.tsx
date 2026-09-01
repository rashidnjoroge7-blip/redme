import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
title: "Your Profile — RedNote",
description: "Manage your RedNote profile and account settings.",
};

export default async function ProfilePage() {
const supabase = await createClient();

const { data: claimsData } = await supabase.auth.getClaims();
const userId = claimsData?.claims?.sub;

if (!userId) {
redirect("/login?next=/profile");
}

const [{ data: userData }, { data: profile }] = await Promise.all([
supabase.auth.getUser(),

supabase
  .from("profiles")
  .select("id, name, email, avatar, bio, location")
  .eq("id", userId)
  .maybeSingle(),

]);

const profileForForm = profile
? {
id: profile.id,
full_name: profile.name,
username: null,
avatar_url: profile.avatar,
bio: profile.bio,
location: profile.location,
}
: null;

return ( <main className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-10"> <div className="pointer-events-none absolute inset-0 overflow-hidden"> <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#ff2442]/10 blur-3xl" /> <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-[#ff6b81]/10 blur-3xl" /> <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#fff0f0] blur-3xl" /> </div>

  <div className="relative mx-auto max-w-3xl">
    <Link
      href="/"
      className="inline-flex rounded-full border border-white/80 bg-white/60 px-4 py-2 text-sm font-semibold text-[#ff2442] shadow-sm backdrop-blur-xl transition hover:bg-white"
    >
      ← Back to RedNote
    </Link>

    <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/80 bg-white/65 shadow-[0_20px_70px_rgba(0,0,0,0.07)] backdrop-blur-2xl">
      <div className="relative overflow-hidden border-b border-white/60 bg-gradient-to-br from-[#fff0f0] via-white/60 to-[#ff6b81]/10 px-6 py-8 sm:px-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#ff2442]/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex rounded-full border border-[#ff2442]/10 bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#ff2442] backdrop-blur">
            Your profile
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl">
            Profile & settings
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            Personalize how you appear across the RedNote community.
          </p>

          <p className="mt-4 inline-flex rounded-full bg-white/70 px-4 py-2 text-xs text-neutral-500 backdrop-blur">
            Signed in as{" "}
            <span className="ml-1 font-semibold text-neutral-800">
              {userData?.user?.email ?? profile?.email ?? "your account"}
            </span>
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <ProfileForm profile={profileForForm} />
      </div>
    </section>
  </div>
</main>

);
}
