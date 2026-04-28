"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MAPEL = [
  "Bahasa Indonesia", "Matematika", "IPA", "IPS",
  "Bahasa Inggris", "PJOK", "Seni Budaya", "Prakarya",
  "Pendidikan Agama", "PKn", "Bahasa Daerah",
];
const GRADES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const FASES = ["A", "B", "C", "D", "E", "F"];

export default function NewClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    subject: "",
    grade: "",
    class_name: "",
    phase: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject || !form.grade || !form.class_name) {
      setError("Mata pelajaran, tingkat, dan nama kelas wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/teaching-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal membuat kelas.");
      setLoading(false);
      return;
    }

    router.push("/classes");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/classes" className="text-gray-400 hover:text-gray-600">←</Link>
          <span className="font-bold text-gray-900">Modulajar</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tambah Kelas Baru</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MAPEL.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, subject: m }))}
                  className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                    form.subject === m
                      ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Grade + Class Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat</label>
              <select
                value={form.grade}
                onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Pilih tingkat...</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
              <input
                type="text"
                value={form.class_name}
                onChange={(e) => setForm((f) => ({ ...f, class_name: e.target.value }))}
                required
                placeholder="1A, 7B, XII IPA-1..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Phase */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fase (opsional)</label>
            <div className="flex gap-2">
              {FASES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, phase: prev.phase === f ? "" : f }))}
                  className={`w-12 h-12 rounded-xl border text-lg font-bold transition-all ${
                    form.phase === f
                      ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Catatan tambahan..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</div>
          )}

          <div className="flex items-center gap-3">
            <Link href="/classes" className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Kelas"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}