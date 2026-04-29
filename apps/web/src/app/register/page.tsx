"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tosAccepted, setTosAccepted] = useState(false);

  async function handleEmailRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!tosAccepted) {
      setError("Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi untuk mendaftar.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.auth.getUser();
    if (profile.user) {
      router.push("/onboarding");
      router.refresh();
    } else {
      router.push("/login?confirmed=1");
    }
  }

  async function handleGoogleRegister() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-50 rounded-full opacity-50 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-50 rounded-full opacity-50 blur-3xl" />
      </div>

      <div className="auth-card relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-200">
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM13 12l3 3M16 12l-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-xl tracking-tight">Modulajar</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Daftar Gratis</h1>
          <p className="text-gray-500 text-sm mt-1.5">
            Gratis untuk guru Indonesia
          </p>
        </div>

        {/* Google SSO */}
        <button
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Daftar dengan Google
        </button>

        {/* Divider */}
        <div className="divider my-6">
          <span>atau</span>
        </div>

        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="form-label">Nama Lengkap</label>
            <input
              id="reg-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="input"
              placeholder="Ibu Sari, S.Pd."
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="form-label">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              placeholder="bu.guru@sekolah.sch.id"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="form-label">Password</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="input"
              placeholder="Min. 8 karakter"
            />
          </div>

          {error && (
            <div className="alert alert-danger">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* ToS checkbox */}
          <div className="flex items-start gap-2.5 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <input
              type="checkbox"
              id="tos"
              checked={tosAccepted}
              onChange={(e) => {
                setTosAccepted(e.target.checked);
                if (error?.includes("Syarat & Ketentuan")) setError(null);
              }}
              className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer flex-shrink-0"
            />
            <label htmlFor="tos" className="leading-relaxed cursor-pointer">
              Saya menyetujui{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">Syarat & Ketentuan</a>,{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">Kebijakan Privasi</a>, dan{" "}
              <a href="/cookies" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">Kebijakan Cookie</a>.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !tosAccepted}
            className="btn btn-primary w-full py-3 mt-2"
          >
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
