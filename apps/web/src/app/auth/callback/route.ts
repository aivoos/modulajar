// Auth callback — handles OAuth redirect + email confirmation
import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      // Ensure user profile exists in `users` table
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existing) {
        // Create default profile from auth metadata
        await supabase.from("users").insert({
          id: user.id,
          full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Guru",
          role: "guru",
          subjects: [],
        });

        // Create free subscription
        await supabase.from("subscriptions").insert({
          user_id: user.id,
          plan: "free",
          status: "active",
          ai_quota_used: 0,
          ai_quota_limit: 0,
        });
      }

      // Set auth cookies
      const session = await supabase.auth.getSession();
      const response = NextResponse.redirect(`${origin}${next}`);

      if (session.data.session) {
        response.cookies.set("sb-access-token", session.data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 3600,
          path: "/",
        });
        response.cookies.set("sb-refresh-token", session.data.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 3600,
          path: "/",
        });
      }

      return response;
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}