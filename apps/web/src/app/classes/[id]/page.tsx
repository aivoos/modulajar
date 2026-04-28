"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  nis: string | null;
  gender: "L" | "P" | null;
  is_active: boolean;
}

interface TeachingClassDetail {
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
  students: Student[];
}

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tc, setTc] = useState<TeachingClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", nis: "", gender: "" as "L" | "P" | "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/teaching-classes/${id}`);
      if (!res.ok) return setLoading(false);
      const { data } = await res.json();
      setTc(data);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newStudent.name.trim()) return;
    setSaving(true);

    const res = await fetch(`/api/teaching-classes/${id}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStudent),
    });

    if (res.ok) {
      const { data } = await res.json();
      setTc((prev) =>
        prev
          ? {
              ...prev,
              students: [...prev.students, data],
              student_count: prev.student_count + 1,
            }
          : prev
      );
      setNewStudent({ name: "", nis: "", gender: "" });
      setAddingStudent(false);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Memuat...</div>
      </div>
    );
  }

  if (!tc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Kelas tidak ditemukan</p>
          <Link href="/classes" className="text-indigo-600 text-sm hover:underline mt-2">← Kembali</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/classes" className="text-gray-400 hover:text-gray-600">←</Link>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-gray-900">Modulajar</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Class info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{tc.class_name}</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{tc.subject} — {tc.grade}</h1>
                  <p className="text-gray-500 text-sm">
                    {tc.academic_years?.label ?? "Tahun ajaran aktif"}
                    {tc.phase && ` • Fase ${tc.phase}`}
                  </p>
                </div>
              </div>
              {tc.notes && (
                <p className="text-gray-500 text-sm mt-3 p-3 bg-gray-50 rounded-xl">{tc.notes}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-indigo-600">{tc.student_count}</span>
              <p className="text-sm text-gray-400">siswa</p>
            </div>
          </div>
        </div>

        {/* Student list */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Daftar Siswa</h2>
            <button
              onClick={() => setAddingStudent(true)}
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              + Tambah Siswa
            </button>
          </div>

          {/* Add student form */}
          {addingStudent && (
            <form
              onSubmit={handleAddStudent}
              className="px-5 py-3 border-b border-gray-100 bg-indigo-50 space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent((s) => ({ ...s, name: e.target.value }))}
                  required
                  placeholder="Nama lengkap siswa"
                  className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={newStudent.nis}
                  onChange={(e) => setNewStudent((s) => ({ ...s, nis: e.target.value }))}
                  placeholder="NIS (opsional)"
                  className="w-32 px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newStudent.gender}
                  onChange={(e) => setNewStudent((s) => ({ ...s, gender: e.target.value as "L" | "P" }))}
                  className="px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">L/P</option>
                  <option value="L">L</option>
                  <option value="P">P</option>
                </select>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setAddingStudent(false)}
                  className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              </div>
            </form>
          )}

          {tc.students.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-4xl mb-2">👶</p>
              <p className="text-gray-500 text-sm">Belum ada siswa. Tambahkan siswa pertama Anda.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase px-5">
                  <th className="px-5 py-2 font-medium">No</th>
                  <th className="py-2 font-medium">Nama</th>
                  <th className="py-2 font-medium">NIS</th>
                  <th className="py-2 font-medium">JK</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tc.students.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-400">{i + 1}</td>
                    <td className="py-3 text-sm text-gray-900 font-medium">{s.name}</td>
                    <td className="py-3 text-sm text-gray-400">{s.nis ?? "—"}</td>
                    <td className="py-3 text-sm text-gray-400">{s.gender ?? "—"}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                      }`}>
                        {s.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}