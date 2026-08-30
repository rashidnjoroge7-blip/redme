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
    <main className="min-h-screen bg-[#fafafa] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff2442]">RedNote</p>
        <h1 className="mt-2 text-3xl font-black">Your account</h1>
        <p className="mt-3 text-neutral-600">Signed in as {userData.user.email}</p>

        <form action="/auth/signout" method="post" className="mt-8">
          <button className="rounded-full bg-[#ff2442] px-5 py-3 font-bold text-white" type="submit">
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
