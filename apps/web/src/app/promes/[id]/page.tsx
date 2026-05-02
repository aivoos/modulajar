"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

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
  content: Record<string, unknown>;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

function renderContent(content: Record<string, unknown>) {
  const alurMingguan = content.alur_mingguan as Array<{
    minggu_ke: number;
    tp_kodes: string[];
    elemen: string;
    topik: string;
    kegiatan_inti: string;
    alokasi_jam: number;
    capaian: string;
  }> | undefined;

  const penilaian = content.penilaian as { formatif: string; sumatif: string } | undefined;

  if (!alurMingguan) {
    return (
      <div className="text-[#64748B] text-center py-12">
        <p className="text-4xl mb-3">📋</p>
        <p>Format PROMES belum tersedia. AI masih dalam proses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {(content.ringkasan as string) && (
        <div className="bg-[#4F46E5]/10 border border-[#4F46E5]/20 rounded-xl p-4">
          <p className="text-sm text-[#818CF8] font-medium mb-1">Ringkasan PROMES</p>
          <p className="text-[#94A3B8] text-sm">{(content.ringkasan as string)}</p>
        </div>
      )}

      {/* Weekly breakdown */}
      <div className="bg-[#161B27] rounded-xl border border-[#21293A] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2030]">
          <h3 className="font-semibold text-[#E2E8F0]">
            Alur Mingguan
            <span className="ml-2 text-xs text-[#475569]">({alurMingguan.length} minggu)</span>
          </h3>
        </div>

        <div className="divide-y divide-[#1A2030]">
          {alurMingguan.map((w) => (
            <div key={w.minggu_ke} className="px-5 py-4 hover:bg-[#1A2030]/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 text-center">
                  <div className="text-lg font-bold text-[#818CF8]">M-{w.minggu_ke}</div>
                  <div className="text-xs text-[#475569]">{w.alokasi_jam} jam</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {w.tp_kodes.map((tp) => (
                      <span key={tp} className="bg-[#4F46E5]/20 text-[#818CF8] px-2 py-0.5 rounded text-xs font-mono">
                        {tp}
                      </span>
                    ))}
                    <span className="text-xs text-[#475569]">· {w.elemen}</span>
                  </div>
                  <p className="text-[#E2E8F0] text-sm font-medium mb-1">{w.topik}</p>
                  <p className="text-[#64748B] text-xs mb-2">{w.kegiatan_inti}</p>
                  <p className="text-[#475569] text-xs">
                    <span className="font-medium text-[#818CF8]">Capaian:</span> {w.capaian}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment schedule */}
      {penilaian && (
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5">
          <h3 className="font-semibold text-[#E2E8F0] mb-3">Jadwal Penilaian</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1A2030] rounded-lg p-3">
              <p className="text-xs text-[#475569] mb-1">Formatif</p>
              <p className="text-sm text-[#94A3B8]">{penilaian.formatif}</p>
            </div>
            <div className="bg-[#1A2030] rounded-lg p-3">
              <p className="text-xs text-[#475569] mb-1">Sumatif</p>
              <p className="text-sm text-[#94A3B8]">{penilaian.sumatif}</p>
            </div>
          </div>
        </div>
      )}

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

export default function PromesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [plan, setPlan] = useState<PromesPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const res = await fetch(`/api/promes/${id}`, {
        headers: { "X-User-ID": user.id },
      });

      if (!res.ok) { setLoading(false); return; }

      const data = await res.json();
      setPlan(data as PromesPlan);
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

      const res = await fetch(`/api/promes/${plan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
        body: JSON.stringify({ status: "published" }),
      });

      if (res.ok) setPlan({ ...plan, status: "published" });
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!plan) return;
    if (!confirm("Hapus PROMES ini?")) return;
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const res = await fetch(`/api/promes/${plan.id}`, {
        method: "DELETE",
        headers: { "X-User-ID": user.id },
      });

      if (res.ok) router.push("/promes");
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
          <p className="text-[#64748B] mb-4">PROMES tidak ditemukan</p>
          <Link href="/promes" className="text-[#818CF8] hover:underline">← Kembali ke PROMES</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/promes" className="text-[#475569] hover:text-[#64748B]">←</Link>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-[#F1F5F9]">Modulajar</span>
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
              {plan.grade && <><span className="text-[#21293A]">·</span><span className="text-sm text-[#64748B]">Kelas {plan.grade}</span></>}
              {plan.phase && <><span className="text-[#21293A]">·</span><span className="text-sm text-[#64748B]">Fase {plan.phase}</span></>}
              <span className="text-[#21293A]">·</span>
              <span className="text-sm text-[#64748B]">Semester {plan.semester}</span>
              <span className="text-[#21293A]">·</span>
              <span className="text-sm text-[#64748B]">{plan.academic_year}</span>
            </div>
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
            <button onClick={handlePublish} disabled={updating}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {updating ? "Memproses..." : "✓ Terbitkan"}
            </button>
          )}
          <button onClick={handleDelete} disabled={deleting}
            className="px-4 py-2 text-red-400 text-sm font-medium hover:text-red-300 disabled:opacity-50 transition-colors ml-auto">
            {deleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>

        {/* Content */}
        {renderContent(plan.content)}
      </main>
    </div>
  );
}