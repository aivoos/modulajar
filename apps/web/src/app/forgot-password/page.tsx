"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Suspense } from "react";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-green-600 text-5xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Cek Email Anda</h2>
        <p className="text-gray-600 text-sm mb-6">
          Kami telah mengirimkan link reset password ke <strong>{email}</strong>.
          Link ini berlaku selama 1 jam.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Tidak menerima email?{" "}
          <button
            onClick={() => setSent(false)}
            className="text-indigo-600 hover:underline"
          >
            Kirim ulang
          </button>
        </p>
        <Link
          href="/login"
          className="text-indigo-600 font-medium hover:underline"
        >
          ← Kembali ke halaman login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Lupa Password?</h1>
        <p className="text-gray-500 text-sm mt-1">
          Masukkan email Anda, kami akan kirimkan link untuk reset password.
        </p>
      </div>

      {confirmed && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200">
          ✓ Password berhasil direset. Silakan login dengan password baru Anda.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="bu.guru@sekolah.sch.id"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Mengirim..." : "Kirim Link Reset Password"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Ingat password Anda?{" "}
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">
          Masuk di sini
        </Link>
      </p>
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <Suspense fallback={<div className="text-center text-gray-500">Memuat...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}