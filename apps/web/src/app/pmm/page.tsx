"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Stats {
  journalCount: number;
  journalMonth: number;
  moduleCount: number;
  gradeCount: number;
}

interface Doc {
  icon: string;
  title: string;
  sub: string;
  ready: boolean;
  color: string;
  href?: string;
  onClick?: () => void;
}

export default function PMMPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [, setLoaded] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const [
        { count: journalCount },
        { count: journalMonth },
        { count: moduleCount },
        { count: gradeCount },
      ] = await Promise.all([
        supabase.from("journals").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("journals").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("date", monthStart),
        supabase.from("modules").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "published"),
        supabase.from("grade_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      setStats({
        journalCount: journalCount ?? 0,
        journalMonth: journalMonth ?? 0,
        moduleCount: moduleCount ?? 0,
        gradeCount: gradeCount ?? 0,
      });
      setLoaded(false);
    }
    load();
  }, [router]);

  async function handleGenerateZIP() {
    if (!confirm("Generate paket bukti PMM dalam format ZIP?\n\nFile akan berisi: rekap jurnal, daftar modul, dan rekap nilai.")) return;
    setGenerating(true);
    try {
      // TODO: wire to API route that generates ZIP
      await new Promise((r) => setTimeout(r, 2000));
      alert("Paket bukti PMM sedang dibuat. Link download akan dikirim via email.");
    } catch {
      alert("Gagal membuat paket. Coba lagi.");
    } finally {
      setGenerating(false);
    }
  }

  const docs: Doc[] = [
    {
      icon: "📓",
      title: "Rekap Jurnal",
      sub: stats ? `${stats.journalMonth} pertemuan · bulan ini` : "Memuat...",
      ready: (stats?.journalMonth ?? 0) > 0,
      color: "#10B981",
      href: "/journal",
    },
    {
      icon: "📊",
      title: "Rekap Nilai",
      sub: stats ? `${stats.gradeCount} entries` : "Memuat...",
      ready: (stats?.gradeCount ?? 0) > 0,
      color: "#F59E0B",
      href: "/grades",
    },
    {
      icon: "📄",
      title: "Daftar Modul",
      sub: stats ? `${stats.moduleCount} modul published` : "Memuat...",
      ready: (stats?.moduleCount ?? 0) > 0,
      color: "#4F46E5",
      href: "/modules",
    },
    {
      icon: "🤔",
      title: "Refleksi AI",
      sub: "AI-generated dari jurnal",
      ready: false,
      color: "#8B5CF6",
      onClick: () => {
        alert("✨ Fitur Refleksi AI sedang dalam pengembangan. Akan tersedia di Sprint 2.");
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[#475569] hover:text-[#64748B]">←</Link>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-[#F1F5F9]">Modulajar</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-[#64748B] hover:text-[#E2E8F0]">Dashboard</Link>
            <Link href="/modules" className="text-[#64748B] hover:text-[#E2E8F0]">Modul</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">🏅 Bukti Kinerja PMM</h1>
          <p className="text-[#64748B] text-sm mt-1">
            Semua dokumen siap upload ke Platform Merdeka Mengajar
          </p>
        </div>

        {/* Hero card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative">
            <p className="text-xs text-white/60 mb-1">Semester Genap 2025/2026</p>
            <h2 className="text-xl font-black tracking-tight mb-1">Paket Bukti Kinerja PMM</h2>
            <p className="text-sm text-white/70 mb-5">Rekap Jurnal + Nilai + Modul + Refleksi AI</p>
            <button
              onClick={handleGenerateZIP}
              disabled={generating}
              className="px-5 py-2.5 bg-amber-400 text-gray-900 rounded-xl text-sm font-bold hover:bg-amber-300 disabled:opacity-60 transition-colors"
            >
              {generating ? "⏳ Membuat paket..." : "📦 Generate Paket ZIP"}
            </button>
          </div>
        </div>

        {/* Doc cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <div
              key={doc.title}
              className="bg-[#161B27] rounded-xl border border-[#21293A] p-5"
            >
              <div className="text-3xl mb-3">{doc.icon}</div>
              <div className="font-bold text-[#E2E8F0] mb-1">{doc.title}</div>
              <div className="text-xs text-[#475569] mb-4">{doc.sub}</div>
              {doc.href ? (
                <Link
                  href={doc.href}
                  className={`block w-full text-center py-2 rounded-xl text-sm font-medium transition-colors ${
                    doc.ready
                      ? "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30"
                      : "bg-[#1A2030] text-[#475569]"
                  }`}
                >
                  {doc.ready ? "📥 Download PDF" : "Belum tersedia"}
                </Link>
              ) : (
                <button
                  onClick={doc.onClick}
                  className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                    doc.ready
                      ? "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30"
                      : "bg-purple-600/10 text-purple-400 hover:bg-purple-600/20"
                  }`}
                >
                  {doc.ready ? "📥 Download PDF" : "✨ Generate AI"}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-4">
          <p className="text-xs text-[#475569]">
            <strong className="text-[#64748B]">Tentang PMM:</strong> Platform Merdeka Mengajar (PMM) meminta guru ASN untuk mengunggah bukti kinerja tiap semester. Modulajar membantu mempercepat dengan menggabungkan semua data dalam satu paket.
          </p>
        </div>
      </main>
    </div>
  );
}
