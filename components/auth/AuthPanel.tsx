"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "login") {
      router.push("/account");
      router.refresh();
      return;
    }

    setMessage("Account created. Check your email if confirmation is enabled.");
    setLoading(false);
  }

  if (userEmail) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">Signed in as</p>
        <p className="mt-1 font-semibold">{userEmail}</p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="mt-5 rounded-full bg-[#ff2442] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Log out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5">
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#ff2442] to-[#ff6b81] p-6 text-white">
        <p className="text-2xl font-extrabold">🇰🇪 RedNote</p>
        <p className="mt-1 text-sm text-white/85">Your Nairobi Life Guide</p>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-xl bg-neutral-100 p-1">
        {(["login", "signup"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              mode === item ? "bg-white shadow-sm" : "text-neutral-500"
            }`}
          >
            {item === "login" ? "Log In" : "Sign Up"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <label className="block text-sm font-medium">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#ff2442]"
            />
          </label>
        )}

        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#ff2442]"
          />
        </label>

        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#ff2442]"
          />
        </label>

        <button
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-[#ff2442] to-[#ff6b81] px-5 py-3 font-bold text-white disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
        </button>
      </form>

      {message && (
        <p role="status" className="mt-4 text-sm text-neutral-600">
          {message}
        </p>
      )}
    </div>
  );
}
