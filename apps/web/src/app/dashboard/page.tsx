"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

const PLAN_LIMITS: Record<string, { full_ai_per_month: number }> = {
  guru_pro: { full_ai_per_month: 10 },
  sekolah: { full_ai_per_month: Infinity },
};

interface DashboardStats {
  draft: number;
  published: number;
  needs_migration: number;
  total: number;
}

interface Subscription {
  plan: string;
  status: string;
  ai_quota_used: number;
  ai_quota_limit: number;
  grace_period_end: string | null;
}

interface Module {
  id: string;
  title: string;
  subject: string;
  fase: string;
  status: string;
  updated_at: string;
  is_curated: boolean;
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ draft: 0, published: 0, needs_migration: 0, total: 0 });
  const [sub, setSub] = useState<Subscription | null>(null);
  const [recentModules, setRecentModules] = useState<Module[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const name = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "Guru";
    setUserName(name);

    // Subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status, ai_quota_used, ai_quota_limit, grace_period_end")
      .eq("user_id", user.id)
      .single();
    if (subscription) setSub(subscription as Subscription);

    // Stats
    const { count: total } = await supabase
      .from("modules")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    const { count: draft } = await supabase
      .from("modules")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "draft");
    const { count: published } = await supabase
      .from("modules")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "published");

    // Migration count
    const { data: pendingMigrations } = await supabase
      .from("module_migrations")
      .select("module_id")
      .eq("status", "pending_review");
    const pendingIds = (pendingMigrations ?? []).map((m: { module_id: string }) => m.module_id);
    let needs_migration = 0;
    if (pendingIds.length > 0) {
      const { count } = await supabase
        .from("modules")
        .select("id", { count: "exact", head: true })
        .in("id", pendingIds)
        .eq("user_id", user.id);
      needs_migration = count ?? 0;
    }

    setStats({
      total: total ?? 0,
      draft: draft ?? 0,
      published: published ?? 0,
      needs_migration,
    });

    // Recent modules
    const { data: recent } = await supabase
      .from("modules")
      .select("id, title, subject, fase, status, updated_at, is_curated")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5);
    setRecentModules((recent as Module[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Computed values
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";
  const firstName = userName.split(" ")[0] ?? "Guru";

  const isFree = sub?.plan === "free";
  const isPro = sub?.plan === "guru_pro" || sub?.plan === "sekolah";
  const limit = isFree ? 0 : (PLAN_LIMITS[sub?.plan ?? ""]?.full_ai_per_month ?? 0);
  const used = sub?.ai_quota_used ?? 0;
  const quotaPct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const quotaLeft = Math.max(0, limit - used);

  const isPastDue = sub?.status === "past_due";
  const graceMs = sub?.grace_period_end ? new Date(sub.grace_period_end).getTime() - Date.now() : 0;
  const graceDaysLeft: number | null = graceMs > 0 ? Math.ceil(graceMs / 86400000) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-gray-900">Modulajar</span>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/modules" className="text-gray-500 hover:text-gray-900">Modul</Link>
            <Link href="/settings" className="text-gray-500 hover:text-gray-900">Pengaturan</Link>
            <form action="/auth/logout" method="POST">
              <button className="text-gray-400 hover:text-gray-600">Keluar</button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}! 👋</h1>
          <p className="text-gray-500 mt-1">
            {isFree ? "Mulai buat modul pertamamu hari ini." : `Kamu sudah punya ${stats.published} modul yang dipublikasi.`}
          </p>
        </div>

        {/* Grace period banner */}
        {graceDaysLeft !== null && graceDaysLeft > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-700">
                Pembayaran gagal — akses penuh berakhir dalam {graceDaysLeft} hari
              </p>
              <Link href="/settings/billing" className="text-xs text-red-600 underline">Bayar sekarang →</Link>
            </div>
          </div>
        )}

        {/* Migration banner */}
        {stats.needs_migration > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <p className="text-sm font-semibold text-amber-700">
                {stats.needs_migration} modul perlu di-review untuk kurikulum baru
              </p>
              <Link href="/modules" className="text-xs text-amber-600 underline">Review sekarang →</Link>
            </div>
          </div>
        )}

        {/* CTA */}
        <div>
          <Link
            href="/modules/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <span className="text-lg">+</span>
            Buat Modul Baru
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-xl border animate-pulse" />
            ))
          ) : (
            <>
              <StatCard label="Draft" value={stats.draft} icon="📝" color="text-gray-400" />
              <StatCard label="Dipublikasi" value={stats.published} icon="✅" color="text-green-600" />
              <StatCard label="Perlu Update" value={stats.needs_migration} icon="📋" color="text-amber-500" />
              <StatCard label="Total Modul" value={stats.total} icon="📚" color="text-indigo-600" />
            </>
          )}
        </div>

        {/* Quota bar (Pro/Sekolah) */}
        {isPro && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-900">Kuota AI Bulan Ini</h2>
                <p className="text-sm text-gray-500">Pakai {used} dari {limit} modul Full AI</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-indigo-600">{quotaLeft}</span>
                <span className="text-sm text-gray-400 ml-1">sisa</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${quotaPct >= 90 ? "bg-red-500" : quotaPct >= 70 ? "bg-amber-500" : "bg-indigo-600"}`}
                style={{ width: `${quotaPct}%` }}
              />
            </div>
            {quotaLeft === 0 && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-amber-600">Kuota habis bulan ini.</p>
                <Link href="/settings/billing?topup=true" className="text-sm text-indigo-600 font-medium hover:underline">
                  + Top-up Rp 5.000 →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Free tier nudge */}
        {isFree && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">Buka semua fitur dengan Guru Pro</h2>
                <p className="text-sm text-gray-500 mb-3">
                  Full AI generate modul + download PDF tanpa watermark + priority support.
                </p>
                <Link
                  href="/settings/billing"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                >
                  Upgrade Rp 29.000/bulan →
                </Link>
              </div>
              <div className="text-4xl">🚀</div>
            </div>
          </div>
        )}

        {/* Recent Modules */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Modul Terbaru</h2>
            <Link href="/modules" className="text-sm text-indigo-600 hover:underline">Lihat semua →</Link>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-4">
                  <div className="h-4 w-48 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-24 bg-gray-50 rounded" />
                </div>
              ))}
            </div>
          ) : recentModules.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-gray-500 font-medium">Belum ada modul</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">Mulai buat modul pertamamu</p>
              <Link href="/modules/new" className="text-indigo-600 font-medium text-sm hover:underline">
                + Buat sekarang
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentModules.map((mod) => (
                <div key={mod.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{mod.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{mod.subject}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        mod.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {mod.status === "published" ? "Dipublikasi" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Link href={`/modules/${mod.id}/edit`} className="text-xs text-indigo-600 font-medium hover:underline">Edit</Link>
                    <Link href={`/modules/${mod.id}`} className="text-xs text-gray-400 hover:text-gray-600">Preview</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
