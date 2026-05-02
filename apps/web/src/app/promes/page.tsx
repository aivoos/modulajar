"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface PromesPlan {
  id: string;
  title: string;
  subject: string;
  phase: string | null;
  grade: string | null;
  academic_year: string;
  semester: string;
  prota_plan_id: string | null;
  status: "draft" | "published";
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
      status === "published"
        ? "bg-emerald-500/15 text-emerald-400"
        : "bg-yellow-500/15 text-yellow-400"
    }`}>
      {status === "published" ? "✓ Terbit" : "Draft"}
    </span>
  );
}

export default function PromesPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PromesPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const { data } = await supabase
      .from("protes_plans")
      .select("id, title, subject, phase, grade, academic_year, semester, prota_plan_id, status, generated_at, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setPlans((data ?? []) as PromesPlan[]);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => { load(); }, [load]);

  // Group by year then semester
  const grouped: Record<string, Record<string, PromesPlan[]>> = {};
  for (const p of plans) {
    if (!grouped[p.academic_year]) grouped[p.academic_year] = {};
    if (!grouped[p.academic_year][p.semester]) grouped[p.academic_year][p.semester] = [];
    grouped[p.academic_year][p.semester].push(p);
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[#475569] hover:text-[#64748B]">←</Link>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-[#F1F5F9]">Modulajar</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-[#64748B] hover:text-[#E2E8F0]">Dashboard</Link>
            <Link href="/prota" className="text-[#64748B] hover:text-[#E2E8F0]">PROTA</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">📆 Program Semester (PROMES)</h1>
            <p className="text-[#64748B] text-sm mt-1">
              Breakdown PROTA per semester dengan alur mingguan
            </p>
          </div>
          <Link
            href="/promes/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <span className="text-lg">+</span>
            Buat Promes Baru
          </Link>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-4 text-center">
              <div className="text-2xl font-bold text-[#818CF8]">{plans.length}</div>
              <div className="text-xs text-[#475569] mt-1">Total PROMES</div>
            </div>
            <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-4 text-center">
              <div className="text-2xl font-bold text-[#10B981]">{plans.filter(p => p.status === "published").length}</div>
              <div className="text-xs text-[#475569] mt-1">Sudah Terbit</div>
            </div>
            <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-4 text-center">
              <div className="text-2xl font-bold text-[#F59E0B]">{plans.filter(p => p.status === "draft").length}</div>
              <div className="text-xs text-[#475569] mt-1">Draft</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#161B27] rounded-xl border border-[#21293A] animate-pulse"/>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-12 text-center">
            <p className="text-4xl mb-3">📆</p>
            <p className="text-[#64748B] font-medium">Belum ada PROMES</p>
            <p className="text-[#475569] text-sm mt-1 mb-4">
              Program Semester breakdown dari PROTA untuk perencanaan lebih detail per minggu
            </p>
            <Link href="/promes/new" className="text-[#818CF8] text-sm font-medium hover:underline">
              + Buat PROMES Baru
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([year, semMap]) => (
              <div key={year}>
                <h2 className="text-sm font-semibold text-[#475569] uppercase tracking-wide mb-3">
                  Tahun Ajaran {year}
                </h2>
                {["1", "2"].map((sem) => {
                  const semPlans = semMap[sem];
                  if (!semPlans?.length) return null;
                  return (
                    <div key={sem} className="mb-6">
                      <h3 className="text-xs font-semibold text-[#475569] mb-2">Semester {sem}</h3>
                      <div className="space-y-2">
                        {semPlans.map((p) => (
                          <div
                            key={p.id}
                            className="bg-[#161B27] rounded-xl border border-[#21293A] p-5 flex items-center justify-between hover:border-[#818CF8]/30 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-[#4F46E5]/20 rounded-xl flex items-center justify-center">
                                <span className="text-[#818CF8] font-bold text-lg">📆</span>
                              </div>
                              <div>
                                <p className="font-semibold text-[#E2E8F0]">{p.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-[#475569]">{p.subject}</span>
                                  {p.grade && <><span className="text-[#21293A]">·</span><span className="text-xs text-[#475569]">Kelas {p.grade}</span></>}
                                  {p.phase && <><span className="text-[#21293A]">·</span><span className="text-xs text-[#475569]">Fase {p.phase}</span></>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={p.status} />
                              <Link href={`/promes/${p.id}`} className="text-sm text-[#818CF8] hover:underline font-medium">
                                Detail →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
