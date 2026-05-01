"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const MAPEL = [
  "Bahasa Indonesia", "Matematika", "IPA", "IPS",
  "Bahasa Inggris", "PJOK", "Seni Budaya", "Prakarya",
  "Pendidikan Agama", "PKn", "Bahasa Daerah",
];
const FASES = ["A", "B", "C", "D", "E", "F"];
const KELAS_MAP: Record<string, number[]> = {
  A: [1, 2, 3], B: [4, 5, 6], C: [7, 8, 9], D: [10, 11, 12], E: [10, 11, 12], F: [11, 12],
};

export default function ScratchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [curriculumId, setCurriculumId] = useState("");
  const [mapel, setMapel] = useState("");
  const [phase, setPhase] = useState("C");
  const [selectedGrades, setSelectedGrades] = useState<number[]>([10]);

  // Load active curriculum version
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("curriculum_versions")
        .select("id")
        .eq("status", "active")
        .limit(1);
      if (data?.[0]) setCurriculumId(data[0].id);
    }
    load();
  }, []);

  function toggleKelas(k: number) {
    setSelectedGrades((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!mapel || !curriculumId) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Fetch appropriate template
    const { data: templates } = await supabase
      .from("module_templates")
      .select("id")
      .eq("curriculum_version_id", curriculumId)
      .limit(1);

    const { data: mod, error } = await supabase
      .from("modules")
      .insert({
        user_id: user.id,
        curriculum_version_id: curriculumId,
        template_id: templates?.[0]?.id ?? null,
        title: "Modul Baru — belum berjudul",
        subject: mapel,
        phase,
        grade: selectedGrades[0]?.toString() ?? null,
        status: "draft",
        content: {},
      })
      .select()
      .single();

    setLoading(false);

    if (error || !mod) {
      alert("Gagal membuat modul. Coba lagi.");
      return;
    }

    router.push(`/modules/${mod.id}/edit`);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Buat dari Nol</h1>
        <p className="text-sm text-gray-500 mt-1">
          Buat modul kosong dan isi sendiri. Kamu bisa minta bantuan AI per section.
        </p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Mapel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
          <div className="grid grid-cols-2 gap-2">
            {MAPEL.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMapel(m)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium text-left transition-all ${
                  mapel === m
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Fase */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fase</label>
          <div className="flex gap-2">
            {FASES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => { setPhase(f); setSelectedGrades(KELAS_MAP[f] ?? [10]); }}
                className={`w-12 h-12 rounded-xl border text-sm font-bold transition-all ${
                  phase === f ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Kelas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
          <div className="flex flex-wrap gap-2">
            {(KELAS_MAP[phase] ?? [10]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => toggleKelas(k)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  selectedGrades.includes(k) ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"
                }`}
              >
                Kelas {k}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!mapel || loading}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Membuat..." : "Buat Modul Kosong"}
          </button>
        </div>
      </form>
    </div>
  );
}
