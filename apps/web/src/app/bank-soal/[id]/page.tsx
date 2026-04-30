"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface Question {
  id: string;
  type: "PG" | "isian" | "uraian" | "benar_salah";
  content: string;
  options: string[];
  answer: string;
  tp_code: string | null;
  difficulty: "mudah" | "sedang" | "sulit";
}

interface QuestionBank {
  id: string;
  title: string;
  subject: string;
  phase: string | null;
  tp_codes: string[];
  question_count: number;
  description: string | null;
  questions: Question[];
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  status: string;
  duration_minutes: number;
  question_count: number;
  created_at: string;
}

const QUESTION_TYPES = [
  { key: "PG", label: "Pilihan Ganda", icon: "🔘" },
  { key: "isian", label: "Isian Singkat", icon: "📝" },
  { key: "uraian", label: "Uraian", icon: "📄" },
  { key: "benar_salah", label: "Benar/Salah", icon: "✓" },
];

const DIFFICULTIES = [
  { key: "mudah", label: "Mudah", color: "text-green-400" },
  { key: "sedang", label: "Sedang", color: "text-yellow-400" },
  { key: "sulit", label: "Sulit", color: "text-red-400" },
];

export default function BankSoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"questions" | "quiz" | "generate">("questions");
  const [generating, setGenerating] = useState(false);
  const [genConfig, setGenConfig] = useState({
    count: 10,
    type: "PG",
    difficulty: "sedang" as "mudah" | "sedang" | "sulit",
  });
  const [selectedQ, setSelectedQ] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
      const [bankRes, quizRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/bank-soal/${id}`, {
          headers: { "X-User-ID": `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/quiz`, {
          headers: { "X-User-ID": `Bearer ${token}` },
        }),
      ]);

      if (bankRes.ok) {
        const data = await bankRes.json();
        setBank(data);
      }
      if (quizRes.ok) {
        const data = await quizRes.json();
        setQuizzes(data.filter((q: { question_bank_id?: string }) => q.question_bank_id === id));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleGenerate() {
    if (!bank) return;
    setGenerating(true);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/agent/generate-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": `Bearer ${token}`,
        },
        body: JSON.stringify({
          question_bank_id: bank.id,
          tp_codes: bank.tp_codes,
          count: genConfig.count,
          type: genConfig.type,
          difficulty: genConfig.difficulty,
          subject: bank.subject,
          phase: bank.phase,
        }),
      });

      if (res.ok) {
        // Reload bank data
        const bankRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/bank-soal/${id}`, {
          headers: { "X-User-ID": `Bearer ${token}` },
        });
        if (bankRes.ok) {
          setBank(await bankRes.json());
        }
        setTab("questions");
      } else {
        const err = await res.json();
        alert(`Gagal generate: ${err.error ?? "unknown"}`);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreateQuiz() {
    if (selectedQ.length === 0) {
      alert("Pilih minimal 1 soal untuk membuat quiz.");
      return;
    }

    const title = prompt("Nama quiz (contoh: Ulangan Harian Bahasa Indonesia)");
    if (!title) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        question_bank_id: id,
        question_ids: selectedQ,
      }),
    });

    if (res.ok) {
      alert("Quiz berhasil dibuat! Cek tab Quiz untuk export PDF.");
      setSelectedQ([]);
      setTab("quiz");
    }
  }

  function toggleSelect(qId: string) {
    setSelectedQ((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <p className="text-[#64748B]">Memuat...</p>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748B] mb-3">Bank soal tidak ditemukan</p>
          <Link href="/bank-soal" className="text-indigo-400 text-sm hover:underline">← Kembali</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/bank-soal" className="text-[#475569] hover:text-[#64748B]">←</Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[#F1F5F9] truncate">{bank.title}</h1>
            <p className="text-xs text-[#475569]">
              {bank.subject} {bank.phase && `· Fase ${bank.phase}`} · {bank.questions?.length ?? bank.question_count} soal
            </p>
          </div>
          {selectedQ.length > 0 && (
            <button
              onClick={handleCreateQuiz}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
            >
              📋 Buat Quiz ({selectedQ.length})
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "questions", label: "📝 Soal", count: bank.questions?.length ?? bank.question_count },
            { key: "quiz", label: "📋 Quiz", count: quizzes.length },
            { key: "generate", label: "🤖 Generate AI", count: null },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-indigo-600 text-white"
                  : "bg-[#161B27] border border-[#21293A] text-[#64748B] hover:text-[#E2E8F0]"
              }`}
            >
              {t.label}
              {t.count !== null && ` (${t.count})`}
            </button>
          ))}
        </div>

        {/* Questions tab */}
        {tab === "questions" && (
          <div className="space-y-3">
            {(bank.questions ?? []).length === 0 ? (
              <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-10 text-center">
                <p className="text-4xl mb-3">🤖</p>
                <p className="text-[#64748B] font-medium">Belum ada soal</p>
                <p className="text-[#475569] text-sm mt-1 mb-4">Generate soal dengan AI untuk menambahkan soal.</p>
                <button onClick={() => setTab("generate")} className="text-indigo-400 text-sm font-medium hover:underline">
                  + Generate soal dengan AI
                </button>
              </div>
            ) : (
              (bank.questions ?? []).map((q) => (
                <div key={q.id} className="bg-[#161B27] rounded-xl border border-[#21293A] p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedQ.includes(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      className="mt-1 accent-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-600/15 px-2 py-0.5 rounded-full">
                          {q.type}
                        </span>
                        {q.tp_code && (
                          <span className="text-xs text-[#475569]">{q.tp_code}</span>
                        )}
                        <span className={`text-xs font-medium ${DIFFICULTIES.find(d => d.key === q.difficulty)?.color ?? ""}`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="text-[#E2E8F0] text-sm mb-2">{q.content}</p>
                      {q.options.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="text-xs text-[#64748B]">
                              {String.fromCharCode(65 + oi)}. {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.answer && (
                        <div className="text-xs bg-emerald-600/10 text-emerald-400 px-2 py-1 rounded-lg inline-block">
                          ✓ Jawaban: {q.answer}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Quiz tab */}
        {tab === "quiz" && (
          <div className="space-y-3">
            {quizzes.length === 0 ? (
              <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-10 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-[#64748B] font-medium">Belum ada quiz</p>
                <p className="text-[#475569] text-sm mt-1 mb-4">Pilih soal di tab Soal, lalu klik &ldquo;Buat Quiz&rdquo;.</p>
              </div>
            ) : (
              quizzes.map((q) => (
                <div key={q.id} className="bg-[#161B27] rounded-xl border border-[#21293A] p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-[#E2E8F0] mb-1">{q.title}</div>
                    <div className="text-xs text-[#475569]">
                      {q.question_count} soal · {q.duration_minutes} menit · {q.status}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-600/30 transition-colors">
                      🖨️ Export PDF
                    </button>
                    <button className="px-3 py-1.5 bg-amber-600/20 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-600/30 transition-colors">
                      📸 Scan Jawaban
                    </button>
                    <Link
                      href={`/quiz/${q.id}`}
                      className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-600/30 transition-colors"
                    >
                      📊 Hasil
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Generate AI tab */}
        {tab === "generate" && (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5 space-y-5">
            <div>
              <h2 className="font-bold text-[#E2E8F0] mb-1">🤖 Generate Soal dengan AI</h2>
              <p className="text-xs text-[#475569]">Soal akan ditambahkan ke bank soal ini berdasarkan TP yang dipilih.</p>
            </div>

            {bank.tp_codes.length > 0 && (
              <div className="bg-[#1A2030] rounded-lg p-3">
                <p className="text-xs text-[#475569] mb-1">TP Codes dari bank soal:</p>
                <div className="flex flex-wrap gap-2">
                  {bank.tp_codes.map((tp) => (
                    <span key={tp} className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded-full">{tp}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#475569] mb-1">Jumlah Soal</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={genConfig.count}
                  onChange={(e) => setGenConfig((p) => ({ ...p, count: parseInt(e.target.value) || 10 }))}
                  className="w-full px-3 py-2.5 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[#475569] mb-1">Tipe Soal</label>
                <select
                  value={genConfig.type}
                  onChange={(e) => setGenConfig((p) => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#475569] mb-1">Tingkat Kesulitan</label>
                <select
                  value={genConfig.difficulty}
                  onChange={(e) => setGenConfig((p) => ({ ...p, difficulty: e.target.value as "mudah" | "sedang" | "sulit" }))}
                  className="w-full px-3 py-2.5 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#475569]">
              <span>💰 Estimasi biaya: ~Rp {(genConfig.count * 270).toLocaleString("id-ID")}</span>
              <span>📊 Pakai 1× AI quota per soal</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || bank.tp_codes.length === 0}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors w-full"
            >
              {generating ? "⏳ Generating..." : "🤖 Generate Soal Sekarang"}
            </button>

            {bank.tp_codes.length === 0 && (
              <p className="text-xs text-amber-400">⚠️ Tambahkan TP codes terlebih dahulu untuk generate soal.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}