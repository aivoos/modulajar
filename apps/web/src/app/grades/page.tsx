"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface TeachingClass {
  id: string;
  subject: string;
  grade: string;
  class_name: string;
  phase: string | null;
  student_count: number;
  academic_years?: { label: string };
}

export default function GradesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<TeachingClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: tc } = await supabase
        .from("teaching_classes")
        .select("id, subject, grade, class_name, phase, student_count, academic_years(label)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("class_name");

      if (tc) setClasses(tc as unknown as TeachingClass[]);
      setLoading(false);
    }
    load();
  }, [router]);

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
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">📊 Nilai Siswa</h1>
          <p className="text-[#64748B] text-sm mt-1">
            Input dan kelola nilai siswa per kelas — formatif & sumatif
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#161B27] rounded-xl border border-[#21293A] animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-10 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-[#64748B] font-medium">Belum ada kelas</p>
            <p className="text-[#475569] text-sm mt-1 mb-4">Tambahkan kelas terlebih dahulu.</p>
            <Link href="/classes/new" className="text-[#818CF8] text-sm font-medium hover:underline">
              + Tambah kelas
            </Link>
          </div>
        ) : (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] overflow-hidden">
            <div className="divide-y divide-[#1A2030]">
              {classes.map((cls, i) => (
                <Link
                  key={cls.id}
                  href={`/grades/${cls.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#1A2030]/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-[#4F46E5]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-[#818CF8] font-bold text-sm">{cls.class_name}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#E2E8F0]">{cls.subject} — {cls.grade}</p>
                    <p className="text-xs text-[#475569] mt-0.5">
                      {cls.student_count} siswa
                      {cls.academic_years?.label && ` · ${cls.academic_years.label}`}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-[#818CF8] text-sm">Input Nilai →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-[#475569]">
          <strong className="text-[#64748B]">Tips:</strong> TP (Tujuan Pembelajaran) dari CP aktif sudah terisi otomatis. Input nilai lalu klik &ldquo;Simpan Nilai&rdquo;.
        </div>
      </main>
    </div>
  );
}
