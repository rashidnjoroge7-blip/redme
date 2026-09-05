"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ForgotPassword } from "@/components/auth/ForgotPassword";

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

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email ?? null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: name.trim(),
              },
            },
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
      <div className="glass-strong rounded-3xl p-6 sm:p-8">
        <div className="rounded-2xl border border-white/70 bg-white/45 p-5 backdrop-blur-xl">
          <p className="text-sm font-medium text-neutral-500">Signed in as</p>
          <p className="mt-1 break-all font-bold text-[#1a1a1a]">
            {userEmail}
          </p>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rednote-button mt-5 w-full rounded-full px-5 py-3 text-sm font-bold"
          >
            Log out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-3xl p-5 sm:p-7">
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff2442] to-[#ff6b81] p-6 text-white shadow-lg shadow-[#ff2442]/15">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          <p className="text-2xl font-extrabold">🇰🇪 RedNote</p>
          <p className="mt-1 text-sm text-white/85">
            Your Nairobi Life Guide
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/70 bg-white/45 p-1 backdrop-blur-xl">
        {(["login", "signup"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
              mode === item
                ? "bg-white text-[#1a1a1a] shadow-sm"
                : "text-neutral-500 hover:text-[#ff2442]"
            }`}
          >
            {item === "login" ? "Log In" : "Sign Up"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <label className="block text-sm font-semibold text-neutral-800">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              className="glass-input mt-1 w-full rounded-2xl px-4 py-3 outline-none"
            />
          </label>
        )}

        <label className="block text-sm font-semibold text-neutral-800">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="glass-input mt-1 w-full rounded-2xl px-4 py-3 outline-none"
          />
        </label>

        <label className="block text-sm font-semibold text-neutral-800">
          Password
          <input
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
            className="glass-input mt-1 w-full rounded-2xl px-4 py-3 outline-none"
          />
        </label>

        {mode === "login" && <ForgotPassword />}

        <button
          type="submit"
          disabled={loading}
          className="rednote-button w-full rounded-full px-5 py-3.5 font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Please wait…"
            : mode === "login"
              ? "Log In"
              : "Create Account"}
        </button>
      </form>

      {message && (
        <p
          role="status"
          className="glass-red mt-4 rounded-2xl px-4 py-3 text-sm"
        >
          {message}
        </p>
      )}
    </div>
  );
}
