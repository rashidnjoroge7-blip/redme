import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const safeNext = next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/account";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=confirmation_failed", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback failed:", error);
    return NextResponse.redirect(new URL("/login?error=confirmation_failed", request.url));
  }

  return NextResponse.redirect(new URL(safeNext, request.url));
}
