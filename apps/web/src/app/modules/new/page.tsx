"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function NewModulePage() {
  const [plan, setPlan] = useState<string>("free");
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, ai_quota_used, ai_quota_limit")
        .eq("user_id", user.id)
        .single();

      if (sub) {
        setPlan(sub.plan);
        const limit = sub.plan === "guru_pro" ? 10 : sub.plan === "sekolah" ? Infinity : 0;
        setQuotaExhausted(sub.ai_quota_used >= limit);
      }
      setLoading(false);
    }
    check();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-8" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const isPro = plan === "guru_pro" || plan === "sekolah";
  const isFree = plan === "free";
  const freeLocked = isFree || quotaExhausted;

  const MODES = [
    {
      id: "full-ai",
      name: "Full AI",
      desc: "AI menghasilkan seluruh modul dari awal. Cocok untuk guru yang belum punya referensi.",
      badge: isFree ? "Tersedia di Guru Pro" : "Pakai 1 slot AI",
      badgeColor: "bg-indigo-100 text-indigo-700",
      locked: freeLocked,
      icon: "🤖",
      href: "/modules/new/ai",
    },
    {
      id: "library",
      name: "Library Publik",
      desc: "Pilih modul yang sudah dibuat guru lain dan sudah dikurasi. Fork dan modifikasi sesuai kebutuhan.",
      badge: "Gratis",
      badgeColor: "bg-green-100 text-green-700",
      locked: false,
      icon: "📖",
      href: "/library",
    },
    {
      id: "scratch",
      name: "Scratch + AI Assist",
      desc: "Buat modul dari nol dengan bantuan AI per section. Suggest, Improve, Generate bagian tertentu.",
      badge: "Gratis",
      badgeColor: "bg-green-100 text-green-700",
      locked: false,
      icon: "✍️",
      href: "/modules/new/scratch",
    },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Buat Modul Baru</h1>
      <p className="text-sm text-gray-500 mb-8">Pilih cara yang paling sesuai dengan kebutuhanmu.</p>

      <div className="grid gap-4">
        {MODES.map((mode) => (
          <div
            key={mode.id}
            className={`relative bg-white rounded-xl border p-5 transition-all ${
              mode.locked
                ? "border-gray-200 opacity-75"
                : "border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-pointer"
            }`}
            onClick={() => !mode.locked && (window.location.href = mode.href)}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                mode.locked ? "bg-gray-100" : "bg-indigo-50"
              }`}>
                {mode.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{mode.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mode.badgeColor}`}>
                    {mode.locked ? "🔒 " : ""}{mode.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{mode.desc}</p>
              </div>
              <div className="text-indigo-600 text-xl">
                {mode.locked ? "→" : "→"}
              </div>
            </div>

            {mode.locked && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Link
                  href="/settings/billing"
                  className="text-sm text-indigo-600 font-medium hover:underline"
                >
                  Upgrade ke Guru Pro →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}