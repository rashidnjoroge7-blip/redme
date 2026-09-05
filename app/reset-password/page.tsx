"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setReady(true);
      } else {
        setMessage("This password reset link is invalid or has expired.");
      }
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Password update failed:", error);
      setMessage("Unable to update your password. Please request a new reset link.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login?reset=success");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fafafa] px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#ff2442]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#ff6b81]/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff2442] to-[#ff6b81] p-6 text-white shadow-lg shadow-[#ff2442]/15">
            <p className="text-2xl font-extrabold">🇰🇪 RedNote</p>
            <p className="mt-1 text-sm text-white/85">Reset your password</p>
          </div>

          {ready ? (
            <form onSubmit={submit} className="space-y-4">
              <label className="block text-sm font-semibold text-neutral-800">
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                  className="glass-input mt-1 w-full rounded-2xl px-4 py-3 outline-none"
                />
              </label>

              <label className="block text-sm font-semibold text-neutral-800">
                Confirm new password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={6}
                  required
                  className="glass-input mt-1 w-full rounded-2xl px-4 py-3 outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="rednote-button w-full rounded-full px-5 py-3.5 font-bold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          ) : (
            <p className="glass-red rounded-2xl px-4 py-3 text-sm">
              {message || "Checking your reset link..."}
            </p>
          )}

          {ready && message && (
            <p role="status" className="glass-red mt-4 rounded-2xl px-4 py-3 text-sm">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
