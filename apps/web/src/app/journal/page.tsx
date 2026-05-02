"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { PendingSyncBanner } from "@/hooks/usePWA";

interface TeachingClass {
  id: string;
  subject: string;
  grade: string;
  class_name: string;
  phase: string | null;
  student_count: number;
  academic_years?: { label: string } | { label: string }[];
  last_journal_date?: string | null;
  this_month_count?: number;
}

interface Journal {
  id: string;
  teaching_class_id: string;
  date: string;
  topic: string;
  activity_main: string | null;
  tp_achievement: number | null;
  created_at: string;
}

function getAcademicYearLabel(ay: TeachingClass["academic_years"]): string | null {
  if (!ay) return null;
  if (Array.isArray(ay)) return ay[0]?.label ?? null;
  return ay.label;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function JournalPage() {
  const [classes, setClasses] = useState<TeachingClass[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: myClasses }, { data: myJournals }] = await Promise.all([
        supabase
          .from("teaching_classes")
          .select("id, subject, grade, class_name, phase, student_count, academic_years(label)")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("class_name"),
        supabase
          .from("journals")
          .select("id, teaching_class_id, date, topic, activity_main, tp_achievement, created_at")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(30),
      ]);

      setClasses((myClasses ?? []) as TeachingClass[]);
      setJournals((myJournals ?? []) as Journal[]);
      setLoading(false);
    }
    load();
  }, []);

  const todayJournals = journals.filter((j) => j.date === selectedDate);

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Nav */}
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
            <h1 className="text-2xl font-bold text-[#F1F5F9]">📖 Jurnal Harian</h1>
            <p className="text-[#64748B] text-sm mt-1">
              Catat kegiatan mengajar setiap hari. Target: 60 detik/hari.
            </p>
          </div>
        </div>

        {/* Date picker */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split("T")[0]);
              }}
              className="px-3 py-2 text-[#64748B] hover:text-[#E2E8F0] transition-colors"
            >
              ←
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split("T")[0]);
              }}
              className="px-3 py-2 text-[#64748B] hover:text-[#E2E8F0] transition-colors"
            >
              →
            </button>
          </div>
        </div>

        {/* Quick fill for each class */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#161B27] rounded-xl border border-[#21293A] animate-pulse"/>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-10 text-center">
            <p className="text-4xl mb-3">📖</p>
            <p className="text-[#64748B] font-medium">Belum ada kelas</p>
            <p className="text-[#475569] text-sm mt-1 mb-4">Tambahkan kelas terlebih dahulu.</p>
            <Link href="/classes/new" className="text-[#818CF8] text-sm font-medium hover:underline">
              + Tambah kelas
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => {
              const journal = todayJournals.find((j) => j.teaching_class_id === cls.id);
              return (
                <div key={cls.id} className="bg-[#161B27] rounded-xl border border-[#21293A] p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#4F46E5]/20 rounded-xl flex items-center justify-center">
                        <span className="text-[#818CF8] font-bold text-sm">{cls.class_name}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#E2E8F0]">{cls.subject}</h3>
                        <p className="text-xs text-[#475569]">
                          {cls.grade} · {cls.student_count} siswa
                          {getAcademicYearLabel(cls.academic_years) && ` · ${getAcademicYearLabel(cls.academic_years)}`}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/journal/${cls.id}?date=${selectedDate}`}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        journal
                          ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                          : "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                      }`}
                    >
                      {journal ? "✓ Sudah Isi" : "Isi Jurnal"}
                    </Link>
                  </div>
                  {journal && journal.topic && (
                    <p className="mt-3 text-sm text-[#64748B] border-t border-[#1A2030] pt-3">
                      <span className="text-[#475569]">Topik:</span> {journal.topic}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Recent journals */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1A2030]">
            <h2 className="font-semibold text-[#E2E8F0]">📋 Riwayat Jurnal</h2>
          </div>
          {journals.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[#475569] text-sm">Belum ada jurnal. Mulai isi untuk hari ini!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A2030]">
              {journals.slice(0, 15).map((j) => {
                const cls = classes.find((c) => c.id === j.teaching_class_id);
                return (
                  <div key={j.id} className="px-5 py-3 hover:bg-[#1A2030]/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#E2E8F0]">{j.topic || "(tanpa topik)"}</p>
                        <p className="text-xs text-[#475569] mt-0.5">
                          {cls?.subject} · {cls?.class_name} · {formatDate(j.date)}
                        </p>
                      </div>
                      {cls && (
                        <Link
                          href={`/journal/${cls.id}?date=${j.date}`}
                          className="text-xs text-[#818CF8] hover:underline"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <PendingSyncBanner />
    </div>
  );
}