"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
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
  notes: string | null;
  academic_year_id: string;
  created_at: string;
  academic_years?: { id: string; label: string };
}

interface AcademicYear {
  id: string;
  label: string;
  is_active: boolean;
}

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<TeachingClass[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    // Load academic years
    const { data: ay } = await supabase
      .from("academic_years")
      .select("id, label, is_active")
      .order("year", { ascending: false });

    if (ay) setYears(ay as AcademicYear[]);
    const activeYear = ay?.find((y) => y.is_active) ?? ay?.[0];
    if (activeYear) setSelectedYear(activeYear.id);

    // Load teaching classes
    const { data: tc } = await supabase
      .from("teaching_classes")
      .select("id, subject, grade, class_name, phase, student_count, notes, academic_year_id, created_at, academic_years (id, label)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (tc) setClasses(tc as unknown as TeachingClass[]);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Hapus kelas ini? Data siswa juga akan dihapus.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/teaching-classes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setClasses((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = selectedYear
    ? classes.filter((c) => c.academic_year_id === selectedYear)
    : classes;

  // Group by subject
  const grouped: Record<string, TeachingClass[]> = {};
  for (const c of filtered) {
    if (!grouped[c.subject]) grouped[c.subject] = [];
    grouped[c.subject].push(c);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-gray-900">Modulajar</span>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">Dashboard</Link>
            <Link href="/modules" className="text-gray-500 hover:text-gray-900">Modul</Link>
            <span className="text-gray-900 font-medium">Kelas</span>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelas Mengajar</h1>
            <p className="text-gray-500 text-sm mt-1">
              {classes.length} kelas • {years.length} tahun ajaran
            </p>
          </div>
          <Link
            href="/classes/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <span className="text-lg">+</span>
            Tambah Kelas
          </Link>
        </div>

        {/* Year filter */}
        {years.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-sm text-gray-400 whitespace-nowrap">Tahun ajaran:</span>
            {years.map((y) => (
              <button
                key={y.id}
                onClick={() => setSelectedYear(y.id)}
                className={`text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedYear === y.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {y.label}
              </button>
            ))}
          </div>
        )}

        {/* Classes grouped by subject */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-xl border animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">🏫</p>
            <p className="text-gray-500 font-medium">Belum ada kelas</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Tambahkan kelas mengajar pertama Anda</p>
            <Link href="/classes/new" className="text-indigo-600 font-medium text-sm hover:underline">
              + Tambah Kelas
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([subject, classList]) => (
              <div key={subject}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {subject}
                </h2>
                <div className="space-y-2">
                  {classList.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                          <span className="text-indigo-600 font-bold text-lg">{c.class_name}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{c.grade}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">
                              {c.student_count} siswa
                            </span>
                            {c.phase && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                Fase {c.phase}
                              </span>
                            )}
                            {c.academic_years?.label && (
                              <span className="text-xs text-gray-400">
                                {c.academic_years.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/classes/${c.id}`}
                          className="text-sm text-indigo-600 font-medium hover:underline"
                        >
                          Detail
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="text-sm text-gray-400 hover:text-red-500 disabled:opacity-50"
                        >
                          {deletingId === c.id ? "..." : "Hapus"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}