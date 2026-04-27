"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const STEP_TITLES = ["Nama Sekolah", "Mata Pelajaran", "Fase Kurikulum"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [fase, setFase] = useState<string>("");

  const MAPEL = [
    "Bahasa Indonesia", "Matematika", "IPA", "IPS",
    "Bahasa Inggris", "PJOK", "Seni Budaya", "Prakarya",
    "Pendidikan Agama", "PKn", "Bahasa Daerah",
  ];
  const FASES = ["A", "B", "C", "D", "E", "F"];

  function toggleSubject(mapel: string) {
    setSubjects((prev) =>
      prev.includes(mapel)
        ? prev.filter((s) => s !== mapel)
        : [...prev, mapel]
    );
  }

  async function handleFinish() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    // Update user profile
    await supabase
      .from("users")
      .update({ subjects, default_fase: fase })
      .eq("id", user.id);

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-8">
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Step {step} of 3</span>
            <span>Skip for now</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6">{STEP_TITLES[step - 1]}</h2>

        {step === 1 && (
          <div className="space-y-4">
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="SMA Negeri 1 Bandung"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Lanjut
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">Pilih semua mata pelajaran yang diajar:</p>
            <div className="grid grid-cols-2 gap-2">
              {MAPEL.map((mapel) => (
                <button
                  key={mapel}
                  onClick={() => toggleSubject(mapel)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    subjects.includes(mapel)
                      ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {mapel}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(3)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Lanjut
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">Fase kurikulum default:</p>
            <div className="flex gap-2 flex-wrap">
              {FASES.map((f) => (
                <button
                  key={f}
                  onClick={() => setFase(f)}
                  className={`w-14 h-14 rounded-xl border text-lg font-bold transition-all ${
                    fase === f
                      ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Mulai Menggunakan Modulajar"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}