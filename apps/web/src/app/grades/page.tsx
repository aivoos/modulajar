"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface TeachingClass {
  id: string;
  subject: string;
  grade: string;
  class_name: string;
  phase: string | null;
  student_count: number;
  academic_years?: { label: string } | { label: string }[];
}

export default function GradesListPage() {
  const [classes, setClasses] = useState<TeachingClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: tc } = await supabase
        .from("teaching_classes")
        .select("id, subject, grade, class_name, phase, student_count, academic_years(id, label)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("class_name");

      if (tc) setClasses(tc as unknown as TeachingClass[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[#475569] hover:text-[#64748B]">←</Link>
            <span className="font-bold text-[#F1F5F9]">📊 Input Nilai</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        <div>
          <h1 className="text-lg font-bold text-[#E2E8F0]">Pilih Kelas</h1>
          <p className="text-xs text-[#475569] mt-1">Input nilai formatif & sumatif per TP untuk setiap kelas.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#161B27] rounded-xl border border-[#21293A] animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16 bg-[#161B27] rounded-xl border border-[#21293A]">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-[#64748B] font-medium">Belum ada kelas</p>
            <p className="text-[#475569] text-sm mt-1 mb-4">Tambahkan kelas terlebih dahulu.</p>
            <Link href="/classes/new" className="text-indigo-400 text-sm font-medium hover:underline">
              + Tambah kelas
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => {
              const ayLabel = Array.isArray(cls.academic_years)
                ? cls.academic_years[0]?.label
                : cls.academic_years?.label;
              return (
                <Link
                  key={cls.id}
                  href={`/grades/${cls.id}`}
                  className="block bg-[#161B27] rounded-xl border border-[#21293A] p-4 hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#4F46E5]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-[#818CF8] font-bold text-sm">{cls.class_name}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#E2E8F0]">{cls.subject} — {cls.grade}</h3>
                      <p className="text-xs text-[#475569] mt-0.5">
                        {cls.student_count} siswa
                        {ayLabel && ` · ${ayLabel}`}
                        {cls.phase && ` · Fase ${cls.phase}`}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-[#818CF8] text-sm font-medium">Input Nilai →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-xs text-[#475569]">
          <strong className="text-[#64748B]">Tips:</strong> TP (Tujuan Pembelajaran) dari CP aktif sudah terisi otomatis. Input nilai lalu klik &ldquo;Simpan Nilai&rdquo;.
        </div>
      </main>
    </div>
  );
}