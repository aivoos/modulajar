export const dynamic = 'force-dynamic';

import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
}) {
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();

  // Handle errors from Supabase auth
  if (resolvedParams.error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Autentikasi Gagal</h1>
          <p className="text-gray-600 mb-6">
            {resolvedParams.error_description ?? "Terjadi kesalahan saat masuk"}
          </p>
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
  const authUser = data.user;

  // Set session cookies
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
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  // Check if user profile exists
  const { data: existing } = await supabase
    .from("users")
    .select("id, full_name, onboarding_done")
    .eq("id", authUser.id)
    .single();

  if (!existing) {
    // First-time user — create profile
    const fullName =
      authUser.user_metadata?.full_name ??
      authUser.user_metadata?.name ??
      authUser.email?.split("@")[0] ??
      "Guru";

    await supabase.from("users").insert({
      id: authUser.id,
      email: authUser.email ?? "",
      full_name: fullName,
      role: "guru",
    });

    // Create free-tier subscription
    await supabase.from("subscriptions").insert({
      user_id: authUser.id,
      plan: "free",
      status: "active",
      ai_quota_used: 0,
      ai_quota_limit: 0,
    });
  }

  // Show onboarding only if not yet completed
  const needsOnboarding = !existing?.onboarding_done;
  redirect(needsOnboarding ? "/onboarding" : "/dashboard");
}