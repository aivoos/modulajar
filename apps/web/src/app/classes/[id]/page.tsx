"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import Link from "next/link";

type Tab = "siswa" | "jurnal" | "nilai";

interface Student {
  id: string;
  name: string;
  nis: string | null;
  gender: "L" | "P" | null;
  is_active: boolean;
  sort_order: number;
}

interface TeachingClassDetail {
  id: string;
  subject: string;
  grade: string;
  class_name: string;
  phase: string | null;
  student_count: number;
  notes: string | null;
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
  const [activeTab, setActiveTab] = useState<Tab>("siswa");
  const [addingStudent, setAddingStudent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped?: number } | null>(null);
  const [newStudent, setNewStudent] = useState({ name: "", nis: "", gender: "" as "L" | "P" | "" });

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
        prev ? { ...prev, students: [...prev.students, data], student_count: prev.student_count + 1 } : prev
      );
      setNewStudent({ name: "", nis: "", gender: "" });
      setAddingStudent(false);
    }
    setSaving(false);
  }

  async function handleImportExcel(file: File) {
    setImporting(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/teaching-classes/${id}/import`, { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setImportResult({ imported: data.imported, skipped: data.skipped });
      // Reload class detail to refresh student list
      const refreshed = await fetch(`/api/teaching-classes/${id}`);
      if (refreshed.ok) {
        const { data: updated } = await refreshed.json();
        setTc(updated);
      }
    } else {
      alert(data.error ?? "Import gagal");
    }
    setImporting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <p className="text-[#64748B]">Memuat...</p>
      </div>
    );
  }

  if (!tc) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748B]">Kelas tidak ditemukan</p>
          <Link href="/classes" className="text-[#818CF8] text-sm hover:underline mt-2">← Kembali</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[#475569] hover:text-[#64748B]">←</Link>
            <span className="font-bold text-[#F1F5F9]">Kelas</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Class info */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{tc.class_name}</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#E2E8F0]">{tc.subject} — {tc.grade}</h1>
                  <p className="text-[#475569] text-sm">
                    {tc.academic_years?.label ?? "Tahun ajaran aktif"}
                    {tc.phase && ` • Fase ${tc.phase}`}
                  </p>
                </div>
              </div>
              {tc.notes && (
                <p className="text-[#64748B] text-sm mt-3 p-3 bg-[#1A2030] rounded-xl">{tc.notes}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-[#818CF8]">{tc.student_count}</span>
              <p className="text-sm text-[#475569]">siswa</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#1A2030]">
          {[
            { key: "siswa" as Tab, label: "Siswa", icon: "👥" },
            { key: "jurnal" as Tab, label: "Jurnal", icon: "📖" },
            { key: "nilai" as Tab, label: "Nilai", icon: "📊" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-indigo-600 text-[#E2E8F0]"
                  : "border-transparent text-[#64748B] hover:text-[#E2E8F0]"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "siswa" && (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1A2030] flex items-center justify-between">
              <h2 className="font-semibold text-[#E2E8F0]">Daftar Siswa</h2>
              <div className="flex items-center gap-3">
                {importResult && (
                  <span className="text-sm text-green-400">
                    ✅ {importResult.imported} siswa di-import{importResult.skipped ? ` (${importResult.skipped} skip)` : ""}
                  </span>
                )}
                <a
                  href={`/api/teaching-classes/${id}/import/template`}
                  className="text-sm text-[#64748B] hover:text-[#818CF8]"
                  target="_blank"
                >
                  📥 Template
                </a>
                <label className="cursor-pointer text-sm text-[#818CF8] font-medium hover:underline">
                  {importing ? "..." : "+ Import Excel"}
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportExcel(f); e.target.value = ""; }}
                  />
                </label>
                <button
                  onClick={() => setAddingStudent(true)}
                  className="text-sm text-[#818CF8] font-medium hover:underline"
                >
                  + Tambah Manual
                </button>
              </div>
            </div>

            {addingStudent && (
              <form
                onSubmit={handleAddStudent}
                className="px-5 py-3 border-b border-[#1A2030] bg-indigo-500/5 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent((s) => ({ ...s, name: e.target.value }))}
                    required
                    placeholder="Nama lengkap siswa"
                    className="flex-1 px-3 py-2 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={newStudent.nis}
                    onChange={(e) => setNewStudent((s) => ({ ...s, nis: e.target.value }))}
                    placeholder="NIS (opsional)"
                    className="w-32 px-3 py-2 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent((s) => ({ ...s, gender: e.target.value as "L" | "P" }))}
                    className="px-3 py-2 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="px-3 py-2 text-[#64748B] hover:text-[#E2E8F0] text-sm"
                  >
                    ✕
                  </button>
                </div>
              </form>
            )}

            {tc.students.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-4xl mb-2">👶</p>
                <p className="text-[#64748B] text-sm">Belum ada siswa. Tambahkan siswa pertama Anda.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-[#475569] uppercase px-5">
                    <th className="px-5 py-2 font-medium">No</th>
                    <th className="py-2 font-medium">Nama</th>
                    <th className="py-2 font-medium">NIS</th>
                    <th className="py-2 font-medium">JK</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2030]">
                  {tc.students.map((s, i) => (
                    <tr key={s.id} className="hover:bg-[#1A2030]/50">
                      <td className="px-5 py-3 text-sm text-[#475569]">{i + 1}</td>
                      <td className="py-3 text-sm text-[#E2E8F0] font-medium">{s.name}</td>
                      <td className="py-3 text-sm text-[#475569]">{s.nis ?? "—"}</td>
                      <td className="py-3 text-sm text-[#475569]">{s.gender ?? "—"}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.is_active ? "bg-green-400/10 text-green-400" : "bg-[#1A2030] text-[#64748B]"
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
        )}

        {activeTab === "jurnal" && (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-10 text-center">
            <p className="text-4xl mb-3">📖</p>
            <h3 className="text-lg font-semibold text-[#E2E8F0] mb-2">Jurnal Harian</h3>
            <p className="text-[#64748B] text-sm mb-4">
              Catat kegiatan mengajar harian untuk kelas ini.
            </p>
            <Link
              href={`/journal/${tc.id}`}
              className="inline-flex px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Buka Jurnal →
            </Link>
          </div>
        )}

        {activeTab === "nilai" && (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-10 text-center">
            <p className="text-4xl mb-3">📊</p>
            <h3 className="text-lg font-semibold text-[#E2E8F0] mb-2">Input Nilai</h3>
            <p className="text-[#64748B] text-sm mb-4">
              Kelola nilai formatif dan sumatif per TP.
            </p>
            <Link
              href={`/grades/${tc.id}`}
              className="inline-flex px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Buka Input Nilai →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
