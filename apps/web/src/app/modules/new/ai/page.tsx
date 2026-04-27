"use client";
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
const DURATIONS = [1, 2, 4, 8, 12, 16];
const LEARNING_STYLES = [
  { id: "visual", label: "Visual", desc: "Diagram, warna, peta konsep", icon: "👁️" },
  { id: "auditori", label: "Auditori", desc: "Diskusi, audio, musik", icon: "👂" },
  { id: "kinestetik", label: "Kinestetik", desc: "Praktik, eksperimen, proyek", icon: "🖐️" },
  { id: "campuran", label: "Campuran", desc: "Kombinasi semua gaya", icon: "🔀" },
];

const STEPS = ["Info Dasar", "Topik & Durasi", "Gaya Belajar", "Ringkasan"];

export default function AiWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [mapel, setMapel] = useState("");
  const [fase, setFase] = useState("C");
  const [kelas, setKelas] = useState<number[]>([10]);
  const [curriculumVersion, setCurriculumVersion] = useState("");

  // Step 2
  const [topik, setTopik] = useState("");
  const [duration, setDuration] = useState(4);

  // Step 3
  const [learningStyle, setLearningStyle] = useState("campuran");

  // Step 4
  const [catatan, setCatatan] = useState("");

  // Fetch curriculum versions
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("curriculum_versions")
        .select("id, name, kurikulum, status")
        .eq("status", "active")
        .limit(5);
      if (data?.[0]) {
        setCurriculumVersion(data[0].id);
        setMapel(data[0].kurikulum === "k13" ? "Matematika" : "Matematika");
      }
    }
    load();
  }, []);

  function toggleKelas(k: number) {
    setKelas((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  }

  async function handleGenerate() {
    setSubmitting(true);

    // eslint-disable-next-line
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Create module first
    const { data: mod, error: modErr } = await supabase
      .from("modules")
      .insert({
        user_id: user.id,
        curriculum_version_id: curriculumVersion,
        module_template_id: curriculumVersion, // placeholder
        title: `Modul AI — ${topik || mapel}`,
        subject: mapel,
        fase,
        kelas,
        duration_weeks: duration,
        learning_style: learningStyle,
        content: { catatan },
        status: "draft",
      })
      .select()
      .single();

    if (modErr || !mod) {
      setSubmitting(false);
      return;
    }

    router.push(`/modules/${mod.id}/edit?ai=generating`);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Step {step} dari {STEPS.length}</span>
          <span>{STEPS[step - 1]}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Info Dasar */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Informasi Dasar</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
            <div className="grid grid-cols-2 gap-2">
              {MAPEL.map((m) => (
                <button
                  key={m}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fase</label>
            <div className="flex gap-2">
              {FASES.map((f) => (
                <button
                  key={f}
                  onClick={() => { setFase(f); setKelas(KELAS_MAP[f] ?? [10]); }}
                  className={`w-12 h-12 rounded-xl border text-sm font-bold transition-all ${
                    fase === f ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
            <div className="flex flex-wrap gap-2">
              {(KELAS_MAP[fase] ?? [10]).map((k) => (
                <button
                  key={k}
                  onClick={() => toggleKelas(k)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    kelas.includes(k) ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"
                  }`}
                >
                  Kelas {k}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!mapel || kelas.length === 0}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Lanjut
          </button>
        </div>
      )}

      {/* Step 2: Topik & Durasi */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Topik & Durasi</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topik Utama</label>
            <input
              type="text"
              value={topik}
              onChange={(e) => setTopik(e.target.value)}
              placeholder="Contoh: Aljabar dasar — persamaan linear satu variabel"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1.5">Semakin spesifik, semakin tepat hasil AI</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durasi</label>
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    duration === d ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"
                  }`}
                >
                  {d} minggu
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
              Kembali
            </button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
              Lanjut
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Gaya Belajar */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Gaya Belajar Siswa</h2>
          <div className="grid grid-cols-2 gap-3">
            {LEARNING_STYLES.map((ls) => (
              <button
                key={ls.id}
                onClick={() => setLearningStyle(ls.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  learningStyle === ls.id
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">{ls.icon}</div>
                <div className="font-semibold text-sm text-gray-900">{ls.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{ls.desc}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
              Kembali
            </button>
            <button onClick={() => setStep(4)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
              Lanjut
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Ringkasan</h2>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {[
              ["Mata Pelajaran", mapel],
              ["Fase / Kelas", `Fase ${fase} — Kelas ${kelas.join(", ")}`],
              ["Topik", topik || "(tidak diisi)"],
              ["Durasi", `${duration} minggu`],
              ["Gaya Belajar", LEARNING_STYLES.find((l) => l.id === learningStyle)?.label ?? ""],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Tambahan <span className="text-gray-400 font-normal">(opsional)</span></label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan untuk AI, misal: gunakan contoh dari kehidupan sehari-hari..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
              Kembali
            </button>
            <button
              onClick={handleGenerate}
              disabled={submitting}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? "Memproses..." : "✨ Generate Sekarang"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}