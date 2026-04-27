"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  { label: "CP Agent", desc: "Membaca Capaian Pembelajaran..." },
  { label: "TP Agent", desc: "Menulis Tujuan Pembelajaran (ABCD format)..." },
  { label: "ATP Agent", desc: "Menyusun Alur Tujuan Pembelajaran..." },
  { label: "Activity Agent", desc: "Mendesain kegiatan pembelajaran..." },
  { label: "Asesmen Agent", desc: "Membuat soal asesmen..." },
  { label: "Validator", desc: "Memvalidasi sesuai template..." },
];

export default function GeneratingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const [failed] = useState(false);

  useEffect(() => {
    // Simulate AI generation (Phase 2: real SSE implementation)
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(interval);
          setDone(true);
          // Auto redirect to editor after 1s
          setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const moduleId = params.get("module_id") ?? "new";
            router.push(`/modules/${moduleId}/edit`);
          }, 1500);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
        {!done ? (
          <>
            {/* Animated robot illustration */}
            <div className="text-6xl mb-6 animate-bounce">🤖</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {STEPS[currentStep].desc}
            </h2>
            <p className="text-sm text-gray-400 mb-8">
              Biasanya selesai dalam 30–60 detik
            </p>

            {/* Progress checklist */}
            <div className="space-y-2 text-left">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3 text-sm">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    i < currentStep
                      ? "bg-green-500 text-white"
                      : i === currentStep
                      ? "bg-indigo-600 text-white animate-pulse"
                      : "bg-gray-200 text-gray-400"
                  }`}>
                    {i < currentStep ? "✓" : i === currentStep ? "⏳" : ""}
                  </div>
                  <span className={
                    i === currentStep ? "text-gray-900 font-medium" : i < currentStep ? "text-gray-500 line-through" : "text-gray-400"
                  }>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-6 w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </>
        ) : failed ? (
          <>
            <div className="text-6xl mb-6">😔</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Generasi Gagal</h2>
            <p className="text-sm text-gray-500 mb-6">
              Terjadi kesalahan saat menghasilkan modul.
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium"
            >
              Coba Lagi
            </button>
          </>
        ) : (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Modul Sudah Siap!</h2>
            <p className="text-sm text-gray-500">Mengalihkan ke editor...</p>
          </>
        )}
      </div>
    </div>
  );
}