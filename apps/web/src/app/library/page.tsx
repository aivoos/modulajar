"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
  const [modules, setModules] = useState<Array<{
    id: string; title: string; subject: string; phase: string;
    grade: string; is_curated: boolean; fork_count: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("modules")
        .select("id, title, subject, phase, grade, is_curated, fork_count")
        .eq("is_curated", true)
        .eq("status", "published")
        .order("fork_count", { ascending: false })
        .limit(20);

      setModules(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleFork(moduleId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setForkingId(moduleId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/library/fork/${moduleId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": (await supabase.auth.getSession()).data.session?.access_token ?? "",
        },
      });

      if (res.ok) {
        const { id } = await res.json();
        router.push(`/modules/${id}/edit`);
      } else {
        const err = await res.json().catch(() => ({ message: "Fork gagal" }));
        alert(err.message ?? "Fork gagal");
      }
    } catch {
      alert("Fork gagal — coba lagi");
    } finally {
      setForkingId(null);
    }
  }

  const MAPEL_COLOR: Record<string, string> = {
    "Matematika": "bg-blue-500", "IPA": "bg-green-500", "IPS": "bg-amber-500",
    "Bahasa Indonesia": "bg-red-500", "Bahasa Inggris": "bg-purple-500",
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Library Publik</h1>
        <p className="text-sm text-gray-500 mt-1">Modul yang dikurasi oleh tim Modulajar.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-gray-500">Belum ada modul yang dikurasi.</p>
          <p className="text-gray-400 text-sm mt-1">Kunjungi lagi nanti!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <div key={mod.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
              <div className={`h-1 ${MAPEL_COLOR[mod.subject] ?? "bg-gray-300"}`} />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{mod.title}</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{mod.subject}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Fase {mod.phase}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Kelas {mod.grade}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">🌿 {mod.fork_count} fork</span>
                  <button
                    onClick={() => handleFork(mod.id)}
                    disabled={forkingId === mod.id}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {forkingId === mod.id ? "Memuat..." : "Gunakan Modul Ini"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}