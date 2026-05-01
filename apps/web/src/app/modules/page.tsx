"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  full_ai: { label: "AI Generate", color: "bg-indigo-100 text-indigo-700" },
  curated: { label: "Kurasi", color: "bg-purple-100 text-purple-700" },
  scratch: { label: "Scratch", color: "bg-gray-100 text-gray-600" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  published: { label: "Dipublikasi", color: "bg-green-100 text-green-700" },
  archived: { label: "Arsip", color: "bg-amber-100 text-amber-700" },
};

const STATUS_FILTERS = ["all", "draft", "published", "archived"];
const MODE_FILTERS = ["all", "full_ai", "curated", "scratch"];

export default function ModulesPage() {
  const [modules, setModules] = useState<Array<{
    id: string; title: string; subject: string; phase: string | null;
    status: string; mode: string; is_curated: boolean; fork_count: number;
    updated_at: string; tags: string[];
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let q = supabase
        .from("modules")
        .select("id, title, subject, phase, status, mode, is_curated, fork_count, updated_at, tags")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (modeFilter !== "all") q = q.eq("mode", modeFilter);

      const { data } = await q;
      setModules(data ?? []);
      setLoading(false);
    }
    load();
  }, [statusFilter, modeFilter]);

  const filtered = search
    ? modules.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.subject.toLowerCase().includes(search.toLowerCase())
      )
    : modules;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daftar Modul</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {modules.length} modul —urutkan newest first
          </p>
        </div>
        <Link href="/modules/new" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <span className="text-base">+</span>
          Buat Modul Baru
        </Link>
      </div>

      {/* Status + Mode Filter */}
      <div className="flex gap-3 mb-5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari modul..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s === "all" ? "Semua" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-purple-50 p-1 rounded-lg">
          {MODE_FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                modeFilter === m ? "bg-white text-purple-700 shadow-sm" : "text-purple-400 hover:text-purple-600"
              }`}
            >
              {m === "all" ? "Semua Mode" : MODE_LABELS[m]?.label ?? m}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-gray-500 font-medium">Belum ada modul</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">
            {search ? "Tidak ada hasil pencarian" : "Mulai buat modul pertamamu"}
          </p>
          <Link href="/modules/new" className="text-indigo-600 font-medium hover:underline text-sm">
            + Buat modul baru
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((mod) => {
            const statusInfo = STATUS_LABELS[mod.status] ?? STATUS_LABELS["draft"];
            return (
              <div key={mod.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{mod.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {mod.is_curated && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Dikurasi</span>
                      )}
                      {mod.mode && MODE_LABELS[mod.mode] && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODE_LABELS[mod.mode].color}`}>
                          {MODE_LABELS[mod.mode].label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span>{mod.subject}</span>
                      {mod.phase && <span>Fase {mod.phase}</span>}
                      {mod.fork_count > 0 && <span>🌿 {mod.fork_count} fork</span>}
                      <span>{new Date(mod.updated_at).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/modules/${mod.id}/edit`} className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50">
                      Edit
                    </Link>
                    <Link href={`/modules/${mod.id}`} className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                      Preview
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}