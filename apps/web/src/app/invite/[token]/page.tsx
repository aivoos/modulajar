"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface InviteInfo {
  school_name: string;
  school_plan: string;
  expires_at: string;
}

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<InviteInfo | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        // Redirect to register with invite token
        router.push(`/register?invite=${token}`);
        return;
      }

      setUser({ id: authUser.id, email: authUser.email ?? "" });

      // Validate token via API (endpoint not yet implemented)
      try {
        // For now, just show the invite form — we don't have a validate endpoint yet
        // Set placeholder school info
        setSchoolInfo({
          school_name: "Sekolah Anda", // Will be populated by join response
          school_plan: "Sekolah",
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } catch {
        setError("Tidak bisa memuat informasi undangan.");
      }

      setLoading(false);
    }
    load();
  }, [token, router]);

  async function handleJoin() {
    setJoining(true);
    setError(null);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/schools/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        if (data.error === "invalid_token") {
          setError("Kode undangan tidak valid atau sudah expired.");
        } else if (data.error === "token_expired") {
          setError("Kode undangan sudah kadaluwarsa. Minta kode baru dari kepala sekolah.");
        } else {
          setError(data.message ?? `Gagal bergabung: ${data.error}`);
        }
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#64748B]">Memuat undangan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-[#161B27] rounded-2xl border border-[#21293A] p-8 text-center">
          {/* School invite badge */}
          <div className="w-16 h-16 bg-[#22C55E]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏫</span>
          </div>

          <h1 className="text-xl font-bold text-[#F1F5F9] mb-2">
            Undangan Bergabung
          </h1>

          <p className="text-[#64748B] text-sm mb-6">
            Anda diundang untuk bergabung dengan{" "}
            <strong className="text-[#E2E8F0]">{schoolInfo?.school_name ?? "sekolah"}</strong>{" "}
            di Modulajar.
          </p>

          {/* Token badge */}
          <div className="inline-flex items-center gap-2 bg-[#22C55E]/10 text-[#22C55E] px-4 py-2 rounded-xl text-sm font-mono font-semibold mb-6">
            <span>🔑</span>
            <span className="tracking-widest">{token.toUpperCase()}</span>
          </div>

          {/* Plan features */}
          <div className="bg-[#1A2030] rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="text-xs text-[#475569] mb-2 font-semibold uppercase tracking-wide">
              Dengan bergabung, Anda dapat:
            </div>
            {[
              "Unlimited AI generate modul (GPT-4o mini)",
              "Jurnal harian + absensi",
              "Input nilai + deskripsi AI",
              "Download PDF tanpa watermark",
            ].map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm text-[#64748B]">
                <span className="text-green-500 mt-0.5">✓</span>
                {f}
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Join button */}
          {user ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {joining ? "Bergabung..." : "Bergabung dengan Sekolah"}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#64748B]">
                Login atau daftar terlebih dahulu untuk bergabung.
              </p>
              <Link
                href={`/register?invite=${token}`}
                className="block w-full py-3 bg-[#4F46E5] text-white rounded-xl font-semibold hover:bg-[#4338CA] transition-colors"
              >
                Daftar / Masuk →
              </Link>
            </div>
          )}

          <p className="text-xs text-[#475569] mt-4">
            Kode undangan berlaku 30 hari. Hubungi kepala sekolah jika expired.
          </p>
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <Link href="/" className="text-xs text-[#475569] hover:text-[#64748B]">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
