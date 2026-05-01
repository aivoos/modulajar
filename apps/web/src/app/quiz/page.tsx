"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface Quiz {
  id: string;
  title: string;
  status: string;
  duration_minutes: number;
  question_count: number;
  teaching_class_id: string | null;
  question_bank_id: string | null;
  question_ids: string[];
  created_at: string;
}

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      let q = supabase
        .from("quizzes")
        .select("id, title, status, duration_minutes, question_count, teaching_class_id, question_bank_id, question_ids, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (statusFilter !== "all") q = q.eq("status", statusFilter);

      const { data } = await q;
      setQuizzes(data ?? []);
      setLoading(false);
    }
    load();
  }, [statusFilter]);

  const STATUS_FILTERS = ["all", "draft", "published", "graded"];

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[#475569] hover:text-[#64748B]">←</Link>
            <span className="font-bold text-[#F1F5F9]">📋 Quiz</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#E2E8F0]">Daftar Quiz</h1>
            <p className="text-xs text-[#475569]">Pilih soal dari bank soal, export PDF, kumpulkan jawaban siswa.</p>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-indigo-600 text-white"
                  : "bg-[#161B27] border border-[#21293A] text-[#64748B] hover:text-[#E2E8F0]"
              }`}
            >
              {s === "all" ? "Semua" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#161B27] rounded-xl border border-[#21293A] animate-pulse" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-16 bg-[#161B27] rounded-xl border border-[#21293A]">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-[#64748B] font-medium">Belum ada quiz</p>
            <p className="text-[#475569] text-sm mt-1 mb-4">
              Buat quiz dari tab "Quiz" di halaman Bank Soal.
            </p>
            <Link href="/bank-soal" className="text-indigo-400 text-sm font-medium hover:underline">
              → Buka Bank Soal
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quiz/${quiz.id}`}
                className="block bg-[#161B27] rounded-xl border border-[#21293A] p-4 hover:border-indigo-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#E2E8F0] truncate">{quiz.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#475569]">
                      <span>📝 {quiz.question_ids?.length ?? quiz.question_count} soal</span>
                      <span>⏱ {quiz.duration_minutes} menit</span>
                      <span>{new Date(quiz.created_at).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      quiz.status === "graded" ? "bg-green-600/15 text-green-400" :
                      quiz.status === "published" ? "bg-indigo-600/15 text-indigo-400" :
                      "bg-gray-600/15 text-gray-400"
                    }`}>
                      {quiz.status}
                    </span>
                    <span className="text-[#818CF8] text-sm">Buka →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}