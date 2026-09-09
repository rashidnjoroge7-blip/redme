import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/account";

  const supabase = await createClient();

  // PKCE flow: /auth/callback?code=...
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth code exchange failed:", error);
      return NextResponse.redirect(
        new URL("/login?error=confirmation_failed", request.url),
      );
    }

    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  // Token-hash flow: /auth/callback?token_hash=...&type=...
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (error) {
      console.error("Auth token verification failed:", error);
      return NextResponse.redirect(
        new URL("/login?error=confirmation_failed", request.url),
      );
    }

    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation_failed", request.url),
  );
}
