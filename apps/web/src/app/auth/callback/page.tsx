export const dynamic = 'force-dynamic';

import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthCallbackPage({ searchParams }: { searchParams: Promise<{ code?: string; error?: string; error_description?: string }> }) {
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();

  // Handle errors from Supabase auth
  if (resolvedParams.error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Autentikasi Gagal</h1>
          <p className="text-gray-600 mb-6">{resolvedParams.error_description ?? "Terjadi kesalahan saat masuk"}</p>
          <a
            href="/login"
            className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Kembali ke Halaman Login
          </a>
        </div>
      </main>
    );
  }

  const code = resolvedParams.code;
  if (!code) {
    redirect("/login");
  }

  const supabase = await createServerClient();

  // Exchange OAuth code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("Auth callback error:", error);
    redirect("/login?error=callback_failed");
  }

  const { access_token, refresh_token } = data.session;

  // Set cookies for the session
  cookieStore.set("sb-access-token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  cookieStore.set("sb-refresh-token", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  // Create user profile if it doesn't exist
  const { data: existing } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("id", data.user.id)
    .single();

  if (!existing) {
    await supabase.from("users").insert({
      id: data.user.id,
      full_name: data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? "Guru",
      role: "guru",
    });

    // Create free subscription
    await supabase.from("subscriptions").insert({
      user_id: data.user.id,
      plan: "free",
      status: "active",
      ai_quota_used: 0,
      ai_quota_limit: 0,
    });
  }

  // Redirect to dashboard or onboarding
  redirect(existing?.full_name ? "/dashboard" : "/onboarding");
}
