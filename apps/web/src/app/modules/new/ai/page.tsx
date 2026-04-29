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
// Per DB schema: grade is text (e.g. "8"), fase A=1-3, B=4-6, C=7-9, D-F=10-12
const KELAS_BY_FASE: Record<string, string[]> = {
  A: ["1", "2", "3"],
  B: ["4", "5", "6"],
  C: ["7", "8", "9"],
  D: ["10", "11", "12"],
  E: ["10", "11", "12"],
  F: ["11", "12"],
};
const DURASI_OPTIONS = [
  { label: "2x35 menit", value: 70 },
  { label: "2x40 menit", value: 80 },
  { label: "3x40 menit", value: 120 },
  { label: "4x40 menit", value: 160 },
  { label: "Sesuai JP", value: 45 },
];
const LEARNING_STYLES = [
  { id: "visual", label: "Visual", desc: "Diagram, warna, peta konsep", icon: "👁️" },
  { id: "auditori", label: "Auditori", desc: "Diskusi, audio, musik", icon: "👂" },
  { id: "kinestetik", label: "Kinestetik", desc: "Praktik, eksperimen, proyek", icon: "🖐️" },
  { id: "campuran", label: "Campuran", desc: "Kombinasi semua gaya", icon: "🔀" },
];

const STEPS = ["Info Dasar", "Topik & Durasi", "Gaya Belajar", "Ringkasan"];

// Map step number to label
const STEP_LABELS = [
  "Membaca Capaian Pembelajaran...",
  "Menulis Tujuan Pembelajaran (ABCD)...",
  "Menyusun Alur Tujuan Pembelajaran...",
  "Mendesain kegiatan pembelajaran...",
  "Membuat instrumen asesmen...",
  "Memvalidasi hasil...",
];

export default function AiWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  // Step 1
  const [mapel, setMapel] = useState("");
  const [fase, setFase] = useState("D");
  const [kelas, setKelas] = useState("10");

  // Step 2
  const [topik, setTopik] = useState("");
  const [durasi, setDurasi] = useState(80);

  // Step 3
  const [learningStyle, setLearningStyle] = useState("campuran");

  // Step 4
  const [catatan, setCatatan] = useState("");

  // Fetch active curriculum version on mount
  const [curriculumVersionId, setCurriculumVersionId] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("curriculum_versions")
        .select("id, name")
        .eq("status", "active")
        .limit(1);
      if (data?.[0]) setCurriculumVersionId(data[0].id);
    }
    load();
  }, []);

  // ── SSE polling for real-time progress ──────────────────────────
  const [progressStep, setProgressStep] = useState(-1); // -1 = not started

  useEffect(() => {
    if (!jobId) return;

    // Poll job status every 2s
    const interval = setInterval(async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
        const session = (await supabase.auth.getSession()).data.session;
        const res = await fetch(`${API_URL}/api/agent/jobs/${jobId}`, {
          headers: { "X-User-ID": session?.access_token ?? "" },
        });
        if (!res.ok) return;
        const { job, steps } = await res.json();

        if (job.status === "done") {
          clearInterval(interval);
          // Auto-redirect to editor
          router.push(`/modules/${job.module_id}/edit`);
        } else if (job.status === "failed") {
          clearInterval(interval);
          alert("Generasi gagal: " + (job.error ?? "Unknown error"));
          router.push("/modules/new");
        } else {
          // Update current step based on completed steps
          const doneSteps = steps.filter((s: { status: string }) => s.status === "done").length;
          setProgressStep(doneSteps);
        }
      } catch {
        // silently ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, router]);

  async function handleGenerate() {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const session = (await supabase.auth.getSession()).data.session;

    try {
      const res = await fetch(`${API_URL}/api/agent/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": session?.access_token ?? user.id,
        },
        body: JSON.stringify({
          subject: mapel,
          phase: fase,
          grade: kelas,
          topik: topik || undefined,
          duration_minutes: durasi,
          learning_style: learningStyle,
          catatan: catatan || undefined,
          curriculum_version_id: curriculumVersionId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message ?? data.error ?? "Gagal memulai generasi");
        setSubmitting(false);
        return;
      }

      setJobId(data.job_id);
      setProgressStep(0);
    } catch (err) {
      alert("Terjadi kesalahan: " + String(err));
      setSubmitting(false);
    }
  }

  // ── Generating screen ───────────────────────────────────────────
  if (jobId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-6 animate-bounce">🤖</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {progressStep >= 0 && progressStep < STEP_LABELS.length
              ? STEP_LABELS[progressStep]
              : "Memproses..."}
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            Biasanya selesai dalam 30–60 detik
          </p>

          {/* Progress checklist */}
          <div className="space-y-2 text-left">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  i < progressStep
                    ? "bg-green-500 text-white"
                    : i === progressStep
                    ? "bg-indigo-600 text-white animate-pulse"
                    : "bg-gray-200 text-gray-400"
                }`}>
                  {i < progressStep ? "✓" : i === progressStep ? "⏳" : ""}
                </div>
                <span className={
                  i === progressStep ? "text-gray-900 font-medium"
                    : i < progressStep ? "text-gray-500 line-through"
                    : "text-gray-400"
                }>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-6 w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((progressStep + 1) / STEP_LABELS.length) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard steps ───────────────────────────────────────────────
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
                  onClick={() => { setFase(f); setKelas(KELAS_BY_FASE[f]?.[0] ?? "10"); }}
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
              {(KELAS_BY_FASE[fase] ?? ["10", "11", "12"]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKelas(k)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    kelas === k ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"
                  }`}
                >
                  Kelas {k}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!mapel}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Alokasi Waktu</label>
            <div className="flex gap-2 flex-wrap">
              {DURASI_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDurasi(d.value)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    durasi === d.value ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"
                  }`}
                >
                  {d.label}
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
              ["Fase / Kelas", `Fase ${fase} — Kelas ${kelas}`],
              ["Topik", topik || "(tidak diisi)"],
              ["Alokasi Waktu", DURASI_OPTIONS.find(d => d.value === durasi)?.label ?? `${durasi} menit`],
              ["Gaya Belajar", LEARNING_STYLES.find(l => l.id === learningStyle)?.label ?? ""],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan Tambahan <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
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