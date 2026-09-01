import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    redirect("/login");
  }

  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData.user) {
    redirect("/login");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#ff2442]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#ff6b81]/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="glass-strong rounded-3xl p-7 sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">
                RedNote
              </p>

              <h1 className="mt-2 text-3xl font-black text-[#1a1a1a]">
                Your account
              </h1>
            </div>

            <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-[#fff0f0] text-xl sm:flex">
              🇰🇪
            </div>
          </div>

          <div className="glass mt-6 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff2442]">
              Signed in
            </p>

            <p className="mt-2 break-all font-semibold text-[#1a1a1a]">
              {userData.user.email}
            </p>
          </div>

          <form action="/auth/signout" method="post" className="mt-6">
            <button
              className="rednote-button rounded-full px-6 py-3 font-bold"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
