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
  difficulty: string;
}

interface Student {
  id: string;
  name: string;
  nis: string | null;
}

interface QuizAttempt {
  id: string;
  student_id: string;
  score: number | null;
  max_score: number | null;
  graded_at: string | null;
  feedback_json: Array<{ question_id: string; correct: boolean; score: number; feedback: string }>;
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  status: string;
  duration_minutes: number;
  questions: Question[];
  attempts: (QuizAttempt & { student: Student })[];
}

export default function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"questions" | "grade" | "results">("questions");
  const [uploading, setUploading] = useState<string | null>(null);
  const [grading, setGrading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/quiz/${id}`, {
        headers: { "X-User-ID": `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setQuiz(data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handlePhotoUpload(studentId: string, file: File) {
    setUploading(studentId);
    try {
      const base64 = await file.arrayBuffer().then((b) => Buffer.from(b).toString("base64"));
      const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/quiz/${id}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: studentId, photo_base64: base64 }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Foto berhasil diupload! Quiz attempt ID: ${data.quiz_attempt_id}`);
      } else {
        const err = await res.json();
        alert(`Gagal upload: ${err.error}`);
      }
    } finally {
      setUploading(null);
    }
  }

  async function handleGradeAttempt(attemptId: string, studentId: string) {
    setGrading(studentId);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";

      // Manual input for now (OCR will be Sprint 2-4.5)
      const answersJson: Record<string, string> = {};
      if (quiz?.questions) {
        for (const q of quiz.questions) {
          const ans = prompt(`Jawaban siswa untuk:\n\n${q.content}\n\n(Kosongkan jika tidak dijawab)`);
          if (ans !== null) answersJson[q.id] = ans;
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/quiz/${id}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": `Bearer ${token}`,
        },
        body: JSON.stringify({
          quiz_attempt_id: attemptId,
          answers_json: answersJson,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Grading selesai! Skor: ${result.score}/100`);
        // Reload quiz data
        load();
      } else {
        const err = await res.json();
        alert(`Gagal grading: ${err.error}`);
      }
    } finally {
      setGrading(null);
    }
  }

  async function load() {
    const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/quiz/${id}`, {
      headers: { "X-User-ID": `Bearer ${token}` },
    });

    if (res.ok) {
      setQuiz(await res.json());
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <p className="text-[#64748B]">Memuat...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748B] mb-3">Quiz tidak ditemukan</p>
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
            <h1 className="font-bold text-[#F1F5F9] truncate">{quiz.title}</h1>
            <p className="text-xs text-[#475569]">
              {quiz.questions.length} soal · {quiz.duration_minutes} menit · {quiz.status}
            </p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
            🖨️ Export PDF
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "questions", label: "📝 Soal", count: quiz.questions.length },
            { key: "grade", label: "📸 Scan & Grade", count: quiz.attempts.length },
            { key: "results", label: "📊 Hasil", count: quiz.attempts.filter((a) => a.score !== null).length },
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
          <div className="space-y-4">
            <div className="bg-[#1A2030] rounded-xl border border-[#21293A] p-4">
              <p className="text-xs text-[#475569]">
                <strong className="text-[#64748B]">Instruksi:</strong> Print soal, bagikan ke siswa, lalu scan jawaban di tab "Scan & Grade".
              </p>
            </div>
            {quiz.questions.map((q, i) => (
              <div key={q.id} className="bg-[#161B27] rounded-xl border border-[#21293A] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-400 font-bold text-sm">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-600/15 px-2 py-0.5 rounded-full">
                        {q.type}
                      </span>
                      {q.tp_code && <span className="text-xs text-[#475569]">{q.tp_code}</span>}
                    </div>
                    <p className="text-[#E2E8F0] text-sm mb-3">{q.content}</p>
                    {q.options.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2 text-sm text-[#64748B]">
                            <span className="w-6 h-6 rounded-full bg-[#1A2030] flex items-center justify-center text-xs">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-xs bg-emerald-600/10 text-emerald-400 px-2 py-1 rounded-lg inline-block">
                      ✓ Kunci: {q.answer}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scan & Grade tab */}
        {tab === "grade" && (
          <div className="space-y-3">
            {quiz.attempts.length === 0 ? (
              <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-10 text-center">
                <p className="text-4xl mb-3">📸</p>
                <p className="text-[#64748B] font-medium">Belum ada jawaban siswa</p>
                <p className="text-[#475569] text-sm mt-1">
                  Upload foto jawaban untuk memulai AI grading dengan Tesseract OCR.
                </p>
              </div>
            ) : (
              quiz.attempts.map((attempt) => (
                <div key={attempt.id} className="bg-[#161B27] rounded-xl border border-[#21293A] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-bold text-[#E2E8F0] mb-1">{attempt.student.name}</div>
                      <div className="text-xs text-[#475569]">
                        {attempt.student.nis && `NIS: ${attempt.student.nis} · `}
                        {attempt.graded_at
                          ? `Dikoreksi: ${new Date(attempt.graded_at).toLocaleDateString("id-ID")}`
                          : "Belum dikoreksi"}
                      </div>
                      {attempt.score !== null && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-600/10 text-emerald-400 rounded-lg text-sm font-bold">
                          <span>Skor: {attempt.score}/100</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <label className="px-3 py-2 bg-amber-600/20 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-600/30 transition-colors cursor-pointer">
                        📸 Upload Foto
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(attempt.student_id, file);
                          }}
                          disabled={uploading === attempt.student_id}
                        />
                      </label>
                      {attempt.graded_at ? (
                        <button
                          onClick={() => setTab("results")}
                          className="px-3 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-600/30 transition-colors"
                        >
                          📊 Lihat Feedback
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGradeAttempt(attempt.id, attempt.student_id)}
                          disabled={grading === attempt.student_id}
                          className="px-3 py-2 bg-indigo-600/20 text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-600/30 transition-colors disabled:opacity-50"
                        >
                          {grading === attempt.student_id ? "⏳ Grading..." : "🤖 Grade AI"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Results tab */}
        {tab === "results" && (
          <div className="space-y-3">
            {quiz.attempts.filter((a) => a.score !== null).length === 0 ? (
              <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-10 text-center">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-[#64748B] font-medium">Belum ada hasil</p>
                <p className="text-[#475569] text-sm mt-1">
                  Grade jawaban siswa untuk melihat hasil dan feedback AI.
                </p>
              </div>
            ) : (
              quiz.attempts
                .filter((a) => a.score !== null)
                .map((attempt) => (
                  <div key={attempt.id} className="bg-[#161B27] rounded-xl border border-[#21293A] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#E2E8F0] mb-1">{attempt.student.name}</div>
                        <div className="text-xs text-[#475569]">
                          Dikoreksi: {new Date(attempt.graded_at!).toLocaleDateString("id-ID", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-[#E2E8F0]">{attempt.score}</div>
                        <div className="text-xs text-[#475569]">/ 100</div>
                      </div>
                    </div>
                    {attempt.feedback_json.length > 0 && (
                      <div className="border-t border-[#1A2030] pt-4 space-y-2">
                        <div className="text-xs text-[#475569] font-medium">Feedback per soal:</div>
                        {attempt.feedback_json.map((fb, fi) => {
                          const q = quiz.questions.find((q) => q.id === fb.question_id);
                          return (
                            <div key={fb.question_id} className="bg-[#1A2030] rounded-lg p-3">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="text-xs text-[#E2E8F0] font-medium flex-1">
                                  Soal {fi + 1}: {q?.content.slice(0, 60)}...
                                </div>
                                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  fb.correct ? "bg-emerald-600/20 text-emerald-400" : "bg-red-600/20 text-red-400"
                                }`}>
                                  {fb.correct ? "✓ Benar" : "✗ Salah"}
                                </div>
                              </div>
                              <div className="text-xs text-[#64748B]">{fb.feedback}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
