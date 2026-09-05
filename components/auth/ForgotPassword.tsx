"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleReset() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Enter your email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const supabase = createClient();

    const redirectTo =
      `${window.location.origin}/auth/callback?next=/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo },
    );

    if (error) {
      console.error("Password reset request failed:", error);
      setStatus("error");
      setMessage(
        "Unable to send the reset email right now. Please try again later.",
      );
      return;
    }

    setStatus("success");
    setMessage(
      "If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.",
    );
  }

  return (
    <div className="mt-4">
      <details className="group">
        <summary className="cursor-pointer list-none text-center text-sm font-medium text-[#ff2442] transition hover:text-[#d91d38]">
          Forgot password?
        </summary>

        <div className="glass mt-3 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Reset your password
          </h3>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            Enter your email and we&apos;ll send you a secure password reset
            link.
          </p>

          <div className="mt-3 space-y-3">
            <input
              id="forgot-password-email"
              name="forgot-password-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={status === "loading"}
              className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none"
            />

            <button
              type="button"
              onClick={handleReset}
              disabled={status === "loading"}
              className="rednote-button w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Sending..." : "Send reset link"}
            </button>
          </div>

          {message && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-3 text-xs leading-5 ${
                status === "success" ? "text-green-700" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
