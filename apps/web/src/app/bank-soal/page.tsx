"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface QuestionBank {
  id: string;
  title: string;
  subject: string;
  phase: string | null;
  tp_codes: string[];
  question_count: number;
  is_public: boolean;
  fork_count: number;
  created_at: string;
}

export default function BankSoalPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newBank, setNewBank] = useState({ title: "", subject: "", phase: "", tp_codes: "" });

  async function load() {
    await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/bank-soal`, {
      headers: { "X-User-ID": `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setBanks(data);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newBank.title.trim()) return;
    setCreating(true);

    await supabase.auth.getUser();
    const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";

    const tpCodes = newBank.tp_codes
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/bank-soal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newBank.title,
          subject: newBank.subject,
          phase: newBank.phase || undefined,
          tp_codes: tpCodes,
        }),
      });

      if (res.ok) {
        const bank = await res.json();
        setBanks((prev) => [bank, ...prev]);
        setShowNew(false);
        setNewBank({ title: "", subject: "", phase: "", tp_codes: "" });
        router.push(`/bank-soal/${bank.id}`);
      } else {
        alert("Gagal membuat bank soal");
      }
    } finally {
      setCreating(false);
    }
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">📝 Bank Soal AI</h1>
            <p className="text-[#64748B] text-sm mt-1">
              Generate soal (PG/isian/uraian/benar_salah) dari TP · Print paper · AI periksa jawaban
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            + Bank Soal Baru
          </button>
        </div>

        {/* How it works */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-4">
          <p className="text-xs text-[#475569] font-medium mb-3">CARA KERJA</p>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { n: "1", label: "Generate Soal", sub: "Pilih TP → AI buat soal", icon: "🤖" },
              { n: "2", label: "Print Paper", sub: "Export PDF → print", icon: "🖨️" },
              { n: "3", label: "Siswa Kerjakan", sub: "Paper-based di kelas", icon: "✏️" },
              { n: "4", label: "AI Koreksi", sub: "Foto jawaban → AI periksa", icon: "📸" },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-lg">{s.icon}</div>
                <div className="text-xs font-bold text-[#E2E8F0]">{s.label}</div>
                <div className="text-xs text-[#475569]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* New bank form */}
        {showNew && (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5">
            <h2 className="font-bold text-[#E2E8F0] mb-4">Bank Soal Baru</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-[#475569] mb-1">Judul Bank Soal *</label>
                <input
                  type="text"
                  value={newBank.title}
                  onChange={(e) => setNewBank((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Contoh: Ulangan Harian Bahasa Indonesia Fase D"
                  className="w-full px-3 py-2.5 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#475569] mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={newBank.subject}
                    onChange={(e) => setNewBank((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="Contoh: Bahasa Indonesia"
                    className="w-full px-3 py-2.5 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#475569] mb-1">Fase (opsional)</label>
                  <select
                    value={newBank.phase}
                    onChange={(e) => setNewBank((p) => ({ ...p, phase: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Semua Fase</option>
                    {["A","B","C","D","E","F"].map((f) => <option key={f} value={f}>Fase {f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#475569] mb-1">TP Codes (pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={newBank.tp_codes}
                  onChange={(e) => setNewBank((p) => ({ ...p, tp_codes: e.target.value }))}
                  placeholder="Contoh: TP.1, TP.2, TP.3"
                  className="w-full px-3 py-2.5 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? "Membuat..." : "🤖 Generate dengan AI"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="px-5 py-2.5 bg-[#1A2030] text-[#64748B] rounded-xl text-sm font-medium hover:bg-[#21293A] transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Banks list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#161B27] rounded-xl border border-[#21293A] animate-pulse" />
            ))}
          </div>
        ) : banks.length === 0 && !showNew ? (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-10 text-center">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-[#64748B] font-medium">Belum ada bank soal</p>
            <p className="text-[#475569] text-sm mt-1 mb-4">Buat bank soal baru untuk mulai generate soal.</p>
            <button
              onClick={() => setShowNew(true)}
              className="text-indigo-400 text-sm font-medium hover:underline"
            >
              + Buat bank soal pertama
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {banks.map((bank) => (
              <Link
                key={bank.id}
                href={`/bank-soal/${bank.id}`}
                className="block bg-[#161B27] rounded-xl border border-[#21293A] p-4 hover:bg-[#1A2030]/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#E2E8F0] mb-1">{bank.title}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-[#475569]">
                      {bank.subject && <span>{bank.subject}</span>}
                      {bank.phase && <span className="bg-indigo-600/15 text-indigo-400 px-2 py-0.5 rounded-full">Fase {bank.phase}</span>}
                      {bank.tp_codes.length > 0 && (
                        <span>{bank.tp_codes.length} TP · {bank.tp_codes.slice(0, 3).join(", ")}{bank.tp_codes.length > 3 ? "..." : ""}</span>
                      )}
                      <span>{bank.question_count} soal</span>
                    </div>
                  </div>
                  <span className="text-indigo-400 text-sm flex-shrink-0">Buka →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-xs text-[#475569]">
          <strong className="text-[#64748B]">Note:</strong> Bank Soal AI masuk Sprint 2 — fitur ini memerlukan subscription aktif.
        </div>
      </main>
    </div>
  );
}
