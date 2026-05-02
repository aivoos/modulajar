"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { saveGradeDraft, isOnline } from "@/lib/offline";
import { PendingSyncBanner } from "@/hooks/usePWA";

interface Student {
  id: string;
  name: string;
  nis: string | null;
  gender: "L" | "P" | null;
  sort_order: number;
}

interface TeachingClass {
  id: string;
  subject: string;
  grade: string;
  class_name: string;
  phase: string | null;
  student_count: number;
  academic_years?: { id: string; label: string };
  students: Student[];
}

interface GradeEntry {
  id: string;
  student_id: string;
  assessment_type: "formatif" | "sumatif" | "diagnostik";
  tp_code: string;
  tp_label: string | null;
  score: number | null;
  notes: string | null;
  assessed_at: string;
}

export type { GradeEntry };

const ASSESSMENT_TYPES = [
  { key: "formatif", label: "Formatif", desc: "Penilaian harian" },
  { key: "sumatif", label: "Sumatif", desc: "Penilaian akhir" },
];

const TPCODES = ["TP.1", "TP.2", "TP.3", "TP.4", "TP.5", "TP.6", "TP.7", "TP.8"];

function scoreColor(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 55) return "text-orange-400";
  return "text-red-400";
}

export default function GradesPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const [cls, setCls] = useState<TeachingClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"formatif" | "sumatif">("formatif");
  const [selectedTP, setSelectedTP] = useState("TP.1");

  // Editable scores: { [studentId]: { [tpCode]: number | null } }
  const [scores, setScores] = useState<Record<string, Record<string, number | null>>>({});

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load class + students
      const classRes = await fetch(`/api/teaching-classes/${classId}`);
      if (!classRes.ok) { setLoading(false); return; }
      const { data: clsData } = await classRes.json();
      setCls(clsData);

      // Load grades
      const { data: gradesData } = await supabase
        .from("grade_entries")
        .select("*")
        .eq("teaching_class_id", classId)
        .eq("assessment_type", activeTab)
        .order("assessed_at", { ascending: false });

      // Build scores map
      const scoresMap: Record<string, Record<string, number | null>> = {};
      (gradesData ?? []).forEach((g) => {
        if (!scoresMap[g.student_id]) scoresMap[g.student_id] = {};
        scoresMap[g.student_id][g.tp_code] = g.score;
      });
      setScores(scoresMap);
      setLoading(false);
    }
    load();
  }, [classId, activeTab]);

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Collect entries
      const entries = [];
      for (const [studentId, tpScores] of Object.entries(scores)) {
        for (const [tpCode, score] of Object.entries(tpScores)) {
          if (score !== null) {
            entries.push({
              user_id: user.id,
              teaching_class_id: classId,
              academic_year_id: cls?.academic_years?.id ?? null,
              student_id: studentId,
              assessment_type: activeTab,
              tp_code: tpCode,
              tp_label: tpCode,
              score,
              notes: null,
              assessed_at: new Date().toISOString().split("T")[0],
            });
          }
        }
      }

      // If offline, save to IndexedDB and return
      if (!isOnline() && entries.length > 0) {
        for (const e of entries) {
          await saveGradeDraft({
            teaching_class_id: classId,
            user_id: user.id,
            student_id: e.student_id,
            assessment_type: e.assessment_type,
            tp_code: e.tp_code,
            score: e.score,
            notes: e.notes,
          });
        }
        setSaving(false);
        alert("📴 Nilai disimpan offline — akan di-sync saat koneksi kembali.");
        return;
      }

      // Online: upsert directly
      if (entries.length > 0) {
        const { error } = await supabase.from("grade_entries").upsert(entries, {
          onConflict: "teaching_class_id,student_id,assessment_type,tp_code",
        });
        if (error) throw error;
      }

      alert("Nilai tersimpan!");
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan nilai.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateDescriptions() {
    if (!cls) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const confirmed = confirm(
      `Generate deskripsi AI untuk semua siswa di kelas ${cls.class_name}?\n\nDeskripsi akan dibuat berdasarkan nilai formatif dan sumatif yang sudah ada.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/grades/generate-descriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ teaching_class_id: classId }),
      });

      if (res.ok) {
        const { job_id } = await res.json();
        alert(`Deskripsi AI sedang dibuat. Job ID: ${job_id}. Cek lagi dalam beberapa menit.`);
      } else {
        const { error } = await res.json();
        alert(`Gagal: ${error}`);
      }
    } catch {
      alert("Terjadi kesalahan. Coba lagi.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <p className="text-[#64748B]">Memuat...</p>
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748B]">Kelas tidak ditemukan</p>
          <Link href="/classes" className="text-[#818CF8] text-sm hover:underline">← Kembali</Link>
        </div>
      </div>
    );
  }

  const studentAvg = (studentId: string): number | null => {
    const studentScores = scores[studentId];
    if (!studentScores) return null;
    const vals = Object.values(studentScores).filter((v): v is number => v !== null);
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/classes" className="text-[#475569] hover:text-[#64748B]">←</Link>
            <span className="font-bold text-[#F1F5F9]">Nilai</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Class header */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#4F46E5]/20 rounded-xl flex items-center justify-center">
                <span className="text-[#818CF8] font-bold text-lg">{cls.class_name}</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#E2E8F0]">{cls.subject} — {cls.grade}</h1>
                <p className="text-xs text-[#475569]">
                  {cls.student_count} siswa · {cls.academic_years?.label}
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateDescriptions}
              className="px-4 py-2 bg-[#4F46E5]/20 text-[#818CF8] rounded-xl text-sm font-medium hover:bg-[#4F46E5]/30 transition-colors"
            >
              ✨ Deskripsi AI
            </button>
          </div>
        </div>

        {/* Tab: Formatif / Sumatif */}
        <div className="flex gap-2">
          {ASSESSMENT_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as "formatif" | "sumatif")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "bg-[#4F46E5] text-white"
                  : "bg-[#161B27] border border-[#21293A] text-[#64748B] hover:text-[#E2E8F0]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TP filter */}
        <div className="flex gap-2 flex-wrap">
          {TPCODES.map((tp) => (
            <button
              key={tp}
              onClick={() => setSelectedTP(tp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedTP === tp
                  ? "bg-[#818CF8] text-white"
                  : "bg-[#161B27] border border-[#21293A] text-[#64748B] hover:text-[#E2E8F0]"
              }`}
            >
              {tp}
            </button>
          ))}
        </div>

        {/* Grades table */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2030] text-left text-xs text-[#475569]">
                  <th className="px-4 py-3 font-medium w-8">No</th>
                  <th className="px-4 py-3 font-medium">Nama Siswa</th>
                  <th className="px-4 py-3 font-medium text-center w-16">NIS</th>
                  {TPCODES.map((tp) => (
                    <th key={tp} className={`px-2 py-3 font-medium text-center w-14 ${selectedTP === tp ? "text-[#818CF8]" : ""}`}>
                      {tp.replace("TP.", "")}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-center">Rata-rata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2030]">
                {cls.students.map((student, i) => {
                  const avg = studentAvg(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-[#1A2030]/50">
                      <td className="px-4 py-3 text-[#475569]">{i + 1}</td>
                      <td className="px-4 py-3 text-[#E2E8F0] font-medium">{student.name}</td>
                      <td className="px-4 py-3 text-[#475569] text-center">{student.nis ?? "—"}</td>
                      {TPCODES.map((tp) => {
                        const val = scores[student.id]?.[tp];
                        return (
                          <td key={tp} className="px-2 py-3 text-center">
                            {selectedTP === tp ? (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={val ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value ? parseInt(e.target.value) : null;
                                  setScores((prev) => ({
                                    ...prev,
                                    [student.id]: { ...(prev[student.id] ?? {}), [tp]: v },
                                  }));
                                }}
                                placeholder="—"
                                className="w-12 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded px-2 py-1 text-center text-sm focus:outline-none focus:border-indigo-500"
                              />
                            ) : (
                              <span className={scoreColor(val ?? null)}>
                                {val !== null && val !== undefined ? val : "—"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${scoreColor(avg)}`}>
                          {avg !== null ? avg : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-[#475569]">
          <span>≥85 hijau</span>
          <span>≥70 kuning</span>
          <span>≥55 oranye</span>
          <span>&lt;55 merah</span>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-[#4F46E5] text-white rounded-xl font-semibold hover:bg-[#4338CA] disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : "Simpan Nilai"}
        </button>
      </main>

      <PendingSyncBanner />
    </div>
  );
}
