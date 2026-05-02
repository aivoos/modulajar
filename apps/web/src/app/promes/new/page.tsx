"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface AcademicYear {
  id: string;
  label: string;
}

interface PromesPlan {
  id: string;
  title: string;
  subject: string;
  phase: string | null;
  grade: string | null;
  academic_year: string;
  status: "draft" | "published";
}

const SUBJECTS = [
  "Bahasa Indonesia", "Matematika", "IPA", "IPS",
  "Bahasa Inggris", "PJOK", "Seni Budaya", "Prakarya",
  "Pendidikan Agama Islam", "Pendidikan Agama Kristen",
  "Informatika", "Mulok (Bahasa Daerah)",
];

const PHASES: Record<string, string[]> = {
  "Bahasa Indonesia": ["A", "B", "C", "D", "E"],
  "Matematika": ["A", "B", "C", "D", "E"],
  "IPA": ["C", "D", "E"],
  "IPS": ["C", "D", "E"],
  "Bahasa Inggris": ["B", "C", "D", "E"],
  "Informatika": ["C", "D", "E"],
};

function getGradesForPhase(phase: string): string[] {
  const grades: Record<string, string[]> = {
    A: ["1", "2", "3", "4", "5", "6"],
    B: ["5", "6", "7", "8", "9"],
    C: ["7", "8", "9"],
    D: ["10", "11"],
    E: ["11", "12"],
  };
  return grades[phase] ?? [];
}

function InnerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState(searchParams.get("subject") ?? "");
  const [phase, setPhase] = useState(searchParams.get("phase") ?? "");
  const [grade, setGrade] = useState(searchParams.get("grade") ?? "");
  const [semester, setSemester] = useState("1");
  const [academicYear, setAcademicYear] = useState("");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [subscription, setSubscription] = useState<{ plan: string } | null>(null);
  const [protaPlans, setProtaPlans] = useState<PromesPlan[]>([]);
  const [selectedProtaId, setSelectedProtaId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: ay } = await supabase
        .from("academic_years")
        .select("id, label")
        .order("year", { ascending: false });
      if (ay) setAcademicYears(ay as AcademicYear[]);

      const activeYear = ay?.find((y) => y.label.includes("/")) ?? ay?.[0];
      if (activeYear) setAcademicYear(activeYear.label);

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single();
      if (sub) setSubscription(sub as { plan: string });

      // Load PROTA plans if subject is set
      if (subject) {
        const { data: protas } = await supabase
          .from("prota_plans")
          .select("id, title, subject, phase, grade, academic_year, status")
          .eq("user_id", user.id)
          .eq("subject", subject)
          .eq("status", "published");
        if (protas) setProtaPlans(protas as PromesPlan[]);
      }

      setLoading(false);
    }
    init();
  }, [router, supabase, subject]);

  const grades = phase ? getGradesForPhase(phase) : [];
  const phases = subject ? (PHASES[subject] ?? ["A", "B", "C", "D", "E"]) : ["A", "B", "C", "D", "E"];
  const canProceedStep1 = subject !== "" && phase !== "" && grade !== "";
  const canProceedStep2 = academicYear !== "";

  async function handleGenerate() {
    if (!canProceedStep1 || !canProceedStep2) return;

    setGenerating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const res = await fetch("/api/promes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
        body: JSON.stringify({
          subject,
          phase,
          grade,
          semester,
          academicYear,
          protaPlanId: selectedProtaId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Gagal memulai generate");
      }

      await pollJobStatus(data.jobId, user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setGenerating(false);
    }
  }

  async function pollJobStatus(jobId: string, userId: string) {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 3000));

      const res = await fetch(`/api/promes/jobs/${jobId}`, {
        headers: { "X-User-ID": userId },
      });
      const data = await res.json();

      if (data.status === "done") {
        const planId = data.output?.promes_plan_id;
        router.push(planId ? `/promes/${planId}` : "/promes");
        return;
      }
      if (data.status === "failed") {
        setError(`Gagal generate: ${data.error ?? "Unknown error"}`);
        setGenerating(false);
        return;
      }

      attempts++;
    }

    setError("Timeout: generate terlalu lama. Cek halaman PROMES nanti.");
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-[#475569]">Memuat...</div>
      </div>
    );
  }

  if (subscription?.plan === "free") {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-6">
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-8 max-w-md text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-[#E2E8F0] mb-2">PROMES memerlukan langganan</h2>
          <p className="text-[#64748B] text-sm mb-6">
            PROTA/PROMES tersedia untuk paket Go atau Plus.
          </p>
          <Link href="/settings/billing" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
            Lihat Paket →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/promes" className="text-[#475569] hover:text-[#64748B]">←</Link>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
          <span className="font-bold text-[#F1F5F9]">Modulajar</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">📆 Buat Program Semester</h1>
          <p className="text-[#64748B] text-sm mt-1">Pilih parameter PROMES</p>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? "bg-indigo-600 text-white" : "bg-[#161B27] border border-[#21293A] text-[#475569]"
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-16 h-0.5 ${step > s ? "bg-indigo-600" : "bg-[#21293A]"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-6 space-y-5">
            <h2 className="font-semibold text-[#E2E8F0]">Step 1 — Pilih Parameter</h2>

            <div>
              <label className="block text-sm text-[#64748B] mb-2">Mata Pelajaran</label>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSubject(s); setPhase(""); setGrade(""); setSelectedProtaId(""); }}
                    className={`p-3 rounded-xl text-sm border transition-colors ${
                      subject === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-[#1A2030] border-[#21293A] text-[#94A3B8] hover:border-[#4F46E5]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {subject && (
              <div>
                <label className="block text-sm text-[#64748B] mb-2">Fase</label>
                <div className="flex gap-2">
                  {phases.map((p) => (
                    <button key={p} onClick={() => { setPhase(p); setGrade(""); }}
                      className={`w-12 h-12 rounded-xl text-sm font-bold border transition-colors ${
                        phase === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-[#1A2030] border-[#21293A] text-[#94A3B8] hover:border-[#4F46E5]"
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase && (
              <div>
                <label className="block text-sm text-[#64748B] mb-2">Kelas</label>
                <div className="flex gap-2 flex-wrap">
                  {grades.map((g) => (
                    <button key={g} onClick={() => setGrade(g)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        grade === g ? "bg-indigo-600 text-white border-indigo-600" : "bg-[#1A2030] border-[#21293A] text-[#94A3B8] hover:border-[#4F46E5]"
                      }`}>
                      Kelas {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {grade && (
              <div>
                <label className="block text-sm text-[#64748B] mb-2">Semester</label>
                <div className="flex gap-2">
                  {["1", "2"].map((s) => (
                    <button key={s} onClick={() => setSemester(s)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${
                        semester === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-[#1A2030] border-[#21293A] text-[#94A3B8] hover:border-[#4F46E5]"
                      }`}>
                      Semester {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {protaPlans.length > 0 && (
              <div>
                <label className="block text-sm text-[#64748B] mb-2">PROTA Acuan (opsional)</label>
                <p className="text-xs text-[#475569] mb-2">Pilih PROTA untuk alur yang lebih akurat</p>
                <div className="space-y-2">
                  <button onClick={() => setSelectedProtaId("")}
                    className={`w-full p-3 rounded-xl text-sm border text-left transition-colors ${
                      selectedProtaId === "" ? "bg-indigo-600/20 border-indigo-500 text-[#818CF8]" : "bg-[#1A2030] border-[#21293A] text-[#94A3B8]"
                    }`}>
                    Tidak pakai PROTA (generate dari CP)
                  </button>
                  {protaPlans.map((p) => (
                    <button key={p.id} onClick={() => setSelectedProtaId(p.id)}
                      className={`w-full p-3 rounded-xl text-sm border text-left transition-colors ${
                        selectedProtaId === p.id ? "bg-indigo-600/20 border-indigo-500 text-[#818CF8]" : "bg-[#1A2030] border-[#21293A] text-[#94A3B8]"
                      }`}>
                      📅 {p.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setStep(2)} disabled={!canProceedStep1}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Lanjut →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-6 space-y-5">
            <h2 className="font-semibold text-[#E2E8F0]">Step 2 — Pilih Tahun Ajaran</h2>

            <div>
              <label className="block text-sm text-[#64748B] mb-2">Tahun Ajaran</label>
              <div className="space-y-2">
                {academicYears.map((ay) => (
                  <button key={ay.id} onClick={() => setAcademicYear(ay.label)}
                    className={`w-full p-4 rounded-xl text-sm border transition-colors text-left ${
                      academicYear === ay.label ? "bg-indigo-600 text-white border-indigo-600" : "bg-[#1A2030] border-[#21293A] text-[#94A3B8] hover:border-[#4F46E5]"
                    }`}>
                    {ay.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 border border-[#21293A] text-[#94A3B8] rounded-xl font-semibold hover:border-[#4F46E5] transition-colors">
                ← Kembali
              </button>
              <button onClick={() => setStep(3)} disabled={!canProceedStep2}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-6 space-y-5">
            <h2 className="font-semibold text-[#E2E8F0]">Step 3 — Konfirmasi & Generate</h2>

            <div className="bg-[#1A2030] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">Mata Pelajaran</span>
                <span className="text-[#E2E8F0] font-medium">{subject}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">Fase</span>
                <span className="text-[#E2E8F0] font-medium">{phase}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">Kelas</span>
                <span className="text-[#E2E8F0] font-medium">{grade}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">Semester</span>
                <span className="text-[#E2E8F0] font-medium">{semester}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">Tahun Ajaran</span>
                <span className="text-[#E2E8F0] font-medium">{academicYear}</span>
              </div>
              {selectedProtaId && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#475569]">PROTA Acuan</span>
                  <span className="text-[#818CF8] font-medium">Ya</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                ❌ {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} disabled={generating}
                className="flex-1 py-3 border border-[#21293A] text-[#94A3B8] rounded-xl font-semibold hover:border-[#4F46E5] disabled:opacity-40 transition-colors">
                ← Kembali
              </button>
              <button onClick={handleGenerate} disabled={generating}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {generating ? (
                  <><span className="animate-spin">⏳</span> Membuat PROMES...</>
                ) : (
                  "🚀 Generate PROMES"
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function NewPromesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-[#475569]">Memuat...</div>
      </div>
    }>
      <InnerPage />
    </Suspense>
  );
}
