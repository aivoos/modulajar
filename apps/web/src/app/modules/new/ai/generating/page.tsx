"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase/client";

const STEPS = [
  { step: 0, label: "CP Agent",       desc: "Membaca Capaian Pembelajaran..." },
  { step: 1, label: "TP Agent",        desc: "Menulis Tujuan Pembelajaran (ABCD)..." },
  { step: 2, label: "ATP Agent",       desc: "Menyusun Alur Tujuan Pembelajaran..." },
  { step: 3, label: "Activity Agent", desc: "Mendesain kegiatan pembelajaran..." },
  { step: 4, label: "Asesmen Agent",  desc: "Membuat instrumen asesmen..." },
  { step: 5, label: "Validator",      desc: "Memvalidasi sesuai template..." },
];

const API_URL = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
  : "http://localhost:3001";

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id");
  const moduleId = searchParams.get("module_id");
  const [currentStep, setCurrentStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) {
      router.replace("/modules/new");
      return;
    }

    async function getToken() {
      const session = (await supabase.auth.getSession()).data.session;
      return session?.access_token ?? jobId;
    }

    function connect(token: string) {
      const es = new EventSource(
        `${API_URL}/api/agent/jobs/${jobId}/stream`,
        { withCredentials: true }
      );

      es.addEventListener("ping", () => {/* heartbeat — ignore */});

      es.addEventListener("connected", () => {
        console.log("[SSE] Connected to job", jobId);
      });

      es.addEventListener("step", (e: MessageEvent) => {
        const data = JSON.parse(e.data) as { step: number };
        setCurrentStep(data.step);
      });

      es.addEventListener("done", (e: MessageEvent) => {
        es.close();
        esRef.current = null;
        setCurrentStep(6);
        setDone(true);
        const data = JSON.parse(e.data) as { module_id?: string };
        const targetId = data.module_id ?? moduleId;
        setTimeout(() => {
          router.replace(`/modules/${targetId}/edit`);
        }, 1500);
      });

      es.addEventListener("error", (e: MessageEvent) => {
        es.close();
        const data = JSON.parse(e.data) as { message?: string };
        console.warn("[SSE] Error:", data.message);
        pollFallback(token);
      });

      esRef.current = es;
    }

    async function pollFallback(token: string) {
      // Fallback: REST polling every 2s
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (attempts > 60) {
          clearInterval(interval);
          setError("Generasi timeout. Silakan coba lagi.");
          return;
        }
        try {
          const res = await fetch(`${API_URL}/api/agent/jobs/${jobId}`, {
            headers: { "X-User-ID": token },
          });
          if (!res.ok) return;
          const { job } = await res.json() as { job: { status: string; module_id?: string } };
          if (job.status === "done") {
            clearInterval(interval);
            setCurrentStep(6);
            setDone(true);
            setTimeout(() => router.replace(`/modules/${job.module_id}/edit`), 1500);
          } else if (job.status === "failed") {
            clearInterval(interval);
            setError("Generasi gagal. Silakan coba lagi.");
          }
        } catch {
          // keep polling
        }
      }, 2000);
    }

    getToken().then((token) => {
      if (token) connect(token);
    }).catch(() => {
      // SSE unavailable, fall back to polling
      getToken().then((token) => {
        if (token) pollFallback(token);
      });
    });

    return () => {
      esRef.current?.close();
    };
  }, [jobId, moduleId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Generasi Gagal</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push("/modules/new")}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Modul Sudah Siap!</h2>
          <p className="text-sm text-gray-400">Mengalihkan ke editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-6 animate-bounce">🤖</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {currentStep >= 0 ? STEPS[currentStep]?.desc : "Menyiapkan generasi..."}
        </h2>
        <p className="text-sm text-gray-400 mb-8">
          Biasanya selesai dalam 30–60 detik
        </p>

        {/* Progress checklist */}
        <div className="space-y-2 text-left">
          {STEPS.map((s, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div key={s.step} className="flex items-center gap-3 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-indigo-600 text-white animate-pulse"
                    : "bg-gray-200 text-gray-400"
                }`}>
                  {isDone ? "✓" : isActive ? "⏳" : ""}
                </div>
                <span className={
                  isActive ? "text-gray-900 font-medium"
                    : isDone ? "text-gray-400 line-through"
                    : "text-gray-400"
                }>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(8, ((currentStep + 1) / STEPS.length) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Memuat...</div>
      </div>
    }>
      <GeneratingContent />
    </Suspense>
  );
}