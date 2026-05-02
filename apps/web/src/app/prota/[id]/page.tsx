"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface ProtaPlan {
  id: string;
  title: string;
  subject: string;
  phase: string | null;
  grade: string | null;
  academic_year: string;
  status: "draft" | "published";
  content: Record<string, unknown>;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

function renderContent(content: Record<string, unknown>) {
  const semesters = content.semester as Array<{
    semester: number;
    minggu_efektif: number;
    alokasi_tp: Array<{ tp_kode: string; elemen: string; alokasi_minggu: number[]; capaian_minggu: string }>;
    ringkasan_semester: string;
  }> | undefined;

  if (!semesters) {
    return (
      <div className="text-[#64748B] text-center py-12">
        <p className="text-4xl mb-3">📋</p>
        <p>Format PROTA belum tersedia. AI masih dalam proses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      {(content.ringkasan as string) && (
        <div className="bg-[#4F46E5]/10 border border-[#4F46E5]/20 rounded-xl p-4">
          <p className="text-sm text-[#818CF8] font-medium mb-1">Ringkasan PROTA</p>
          <p className="text-[#94A3B8] text-sm">{(content.ringkasan as string)}</p>
        </div>
      )}

      {/* Semester tables */}
      {semesters.map((sem) => (
        <div key={sem.semester} className="bg-[#161B27] rounded-xl border border-[#21293A] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1A2030] flex items-center justify-between">
            <h3 className="font-semibold text-[#E2E8F0]">
              Semester {sem.semester}
              <span className="ml-2 text-xs text-[#475569]">
                ({sem.minggu_efektif} minggu efektif)
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2030]">
                  <th className="text-left px-5 py-3 text-[#475569] font-medium w-16">TP</th>
                  <th className="text-left px-5 py-3 text-[#475569] font-medium w-40">Elemen</th>
                  <th className="text-left px-5 py-3 text-[#475569] font-medium">Alokasi Minggu</th>
                  <th className="text-left px-5 py-3 text-[#475569] font-medium">Capaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2030]">
                {sem.alokasi_tp.map((tp, i) => (
                  <tr key={i} className="hover:bg-[#1A2030]/50 transition-colors">
                    <td className="px-5 py-4 text-[#818CF8] font-mono text-xs">{tp.tp_kode}</td>
                    <td className="px-5 py-4 text-[#E2E8F0]">{tp.elemen}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {tp.alokasi_minggu.map((w) => (
                          <span key={w} className="bg-[#4F46E5]/20 text-[#818CF8] px-2 py-0.5 rounded text-xs font-mono">
                            M-{w}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#94A3B8] text-xs max-w-xs">{tp.capaian_minggu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sem.ringkasan_semester && (
            <div className="px-5 py-3 border-t border-[#1A2030] bg-[#0D1117]/50">
              <p className="text-xs text-[#475569]">
                <span className="font-medium">Ringkasan:</span> {sem.ringkasan_semester}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Notes */}
      {(content.catatan as string) && (
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5">
          <h3 className="font-semibold text-[#E2E8F0] mb-2">Catatan</h3>
          <p className="text-[#64748B] text-sm whitespace-pre-wrap">{(content.catatan as string)}</p>
        </div>
      )}
    </div>
  );
}

export default function ProtaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [plan, setPlan] = useState<ProtaPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const res = await fetch(`/api/prota/${id}`, {
        headers: { "X-User-ID": user.id },
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      setPlan(data as ProtaPlan);
      setLoading(false);
    }
    load();
  }, [id, router, supabase]);

  async function handlePublish() {
    if (!plan) return;
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const res = await fetch(`/api/prota/${plan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
        body: JSON.stringify({ status: "published" }),
      });

      if (res.ok) {
        setPlan({ ...plan, status: "published" });
      }
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!plan) return;
    if (!confirm("Hapus PROTA ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const res = await fetch(`/api/prota/${plan.id}`, {
        method: "DELETE",
        headers: { "X-User-ID": user.id },
      });

      if (res.ok) {
        router.push("/prota");
      }
    } catch {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-4xl px-6">
          <div className="h-8 w-64 bg-[#161B27] rounded animate-pulse"/>
          <div className="h-64 bg-[#161B27] rounded animate-pulse"/>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-[#64748B] mb-4">PROTA tidak ditemukan</p>
          <Link href="/prota" className="text-[#818CF8] hover:underline">← Kembali ke PROTA</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Nav */}
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/prota" className="text-[#475569] hover:text-[#64748B]">←</Link>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-[#F1F5F9]">Modulajar</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/promes/new?subject=${encodeURIComponent(plan.subject)}&phase=${plan.phase ?? ""}&grade=${plan.grade ?? ""}`}
              className="text-sm text-[#818CF8] hover:underline"
            >
              + Buat Promes dari PROTA ini
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">{plan.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-[#64748B]">{plan.subject}</span>
              {plan.grade && <span className="text-[#21293A] text-sm">·</span>}
              {plan.grade && <span className="text-sm text-[#64748B]">Kelas {plan.grade}</span>}
              {plan.phase && <span className="text-[#21293A] text-sm">·</span>}
              {plan.phase && <span className="text-sm text-[#64748B]">Fase {plan.phase}</span>}
              <span className="text-[#21293A] text-sm">·</span>
              <span className="text-sm text-[#64748B]">{plan.academic_year}</span>
            </div>
            {plan.generated_at && (
              <p className="text-xs text-[#475569] mt-1">
                Dibuat: {new Date(plan.generated_at).toLocaleDateString("id-ID", {
                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              plan.status === "published" ? "bg-emerald-500/15 text-emerald-400" : "bg-yellow-500/15 text-yellow-400"
            }`}>
              {plan.status === "published" ? "✓ Terbit" : "Draft"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {plan.status === "draft" && (
            <button
              onClick={handlePublish}
              disabled={updating}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {updating ? "Memproses..." : "✓ Terbitkan"}
            </button>
          )}
          <Link
            href={`/prota/${plan.id}/edit`}
            className="px-4 py-2 border border-[#21293A] text-[#94A3B8] rounded-xl text-sm font-semibold hover:border-[#4F46E5] transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-red-400 text-sm font-medium hover:text-red-300 disabled:opacity-50 transition-colors ml-auto"
          >
            {deleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>

        {/* Content */}
        {renderContent(plan.content)}
      </main>
    </div>
  );
}