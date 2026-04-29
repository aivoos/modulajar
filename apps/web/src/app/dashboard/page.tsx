"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
  phase: string;
  status: string;
  updated_at: string;
  is_curated: boolean;
}

interface JournalStreak {
  current_streak: number;
  longest_streak: number;
  this_month: number;
  last_journal_date: string | null;
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-[#475569] mt-1">{label}</div>
    </div>
  );
}

function getActiveAcademicYear(): { label: string; year: number; semester: "ganjil" | "genap" } {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const month = wib.getUTCMonth();
  const wibYear = wib.getUTCFullYear();
  if (month >= 6) {
    return { label: `${wibYear}/${wibYear + 1}`, year: wibYear, semester: "ganjil" };
  } else {
    return { label: `${wibYear - 1}/${wibYear}`, year: wibYear - 1, semester: "genap" };
  }
}

function getWIBGreeting(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const hour = wib.getUTCHours();
  if (hour < 12) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function computeStreak(dates: string[]): { current: number; longest: number; lastDate: string | null } {
  if (!dates.length) return { current: 0, longest: 0, lastDate: null };
  const sorted = [...dates].sort().reverse();
  const lastDate = sorted[0];

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split("T")[0];

  let longest = 0;
  let run = 0;
  let prevDate: Date | null = null;

  for (const d of sorted) {
    if (prevDate === null) {
      run = 1;
    } else {
      const diff = (prevDate.getTime() - new Date(d).getTime()) / 86400000;
      if (diff === 1) {
        run++;
      } else {
        longest = Math.max(longest, run);
        run = 1;
      }
    }
    prevDate = new Date(d);
  }
  longest = Math.max(longest, run);

  // Current streak: must have journal today or yesterday
  const streakCheck = [todayStr, yesterdayStr];
  let current = 0;
  const checkDate = streakCheck.includes(lastDate) ? new Date(lastDate) : null;
  if (checkDate) {
    let cursor = checkDate;
    for (const d of sorted) {
      const diff = Math.abs((cursor.getTime() - new Date(d).getTime()) / 86400000);
      if (diff <= 1) {
        current++;
        cursor = new Date(d);
      } else break;
    }
  }

  return { current, longest, lastDate };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ draft: 0, published: 0, needs_migration: 0, total: 0 });
  const [sub, setSub] = useState<Subscription | null>(null);
  const [recentModules, setRecentModules] = useState<Module[]>([]);
  const [streak, setStreak] = useState<JournalStreak>({ current_streak: 0, longest_streak: 0, this_month: 0, last_journal_date: null });
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState("");
  const router = useRouter();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const name = (user.user_metadata?.full_name as string | undefined)
      ?? (user.user_metadata?.name as string | undefined)
      ?? user.email?.split("@")[0]
      ?? "Guru";
    setUserName(name);

    const target = getActiveAcademicYear();
    setAcademicYear(target.label);

    const { data: existingSameYear } = await supabase
      .from("academic_years")
      .select("id")
      .ilike("label", `${target.label}%`)
      .limit(1);

    if (!existingSameYear || existingSameYear.length === 0) {
      await supabase.from("academic_years").insert({
        label: `${target.label} (Personal)`,
        year: target.year,
        semester: target.semester,
        start_date: `${target.year}-07-15`,
        end_date: `${target.year + 1}-06-30`,
        is_active: true,
      });
    }

    const [{ data: subscription }, { count: total }, { count: draft }, { count: published }] =
      await Promise.all([
        supabase.from("subscriptions")
          .select("plan, status, ai_quota_used, ai_quota_limit, grace_period_end")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("modules").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("modules").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "draft"),
        supabase.from("modules").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "published"),
      ]);

    if (subscription) setSub(subscription as Subscription);

    const { data: pendingMigrations } = await supabase
      .from("module_migrations").select("module_id").eq("status", "pending_review");
    const pendingIds = (pendingMigrations ?? []).map((m: { module_id: string }) => m.module_id);
    let needs_migration = 0;
    if (pendingIds.length > 0) {
      const { count } = await supabase.from("modules")
        .select("id", { count: "exact", head: true }).in("id", pendingIds).eq("user_id", user.id);
      needs_migration = count ?? 0;
    }

    setStats({ total: total ?? 0, draft: draft ?? 0, published: published ?? 0, needs_migration });

    // Journal streak
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { data: journalDates } = await supabase
      .from("journals")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", monthStart);
    const thisMonth = journalDates?.length ?? 0;

    const { data: allJournalDates } = await supabase
      .from("journals")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100);
    const { current, longest, lastDate } = computeStreak(
      (allJournalDates ?? []).map((j: { date: string }) => j.date)
    );
    setStreak({ current_streak: current, longest_streak: longest, this_month: thisMonth, last_journal_date: lastDate });

    const { data: recent } = await supabase
      .from("modules")
      .select("id, title, subject, phase, status, updated_at, is_curated")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5);
    setRecentModules((recent as Module[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const greeting = getWIBGreeting();
  const firstName = userName.split(" ")[0] ?? "Guru";

  const isFree = sub?.plan === "free";
  const isPro = sub?.plan === "pro" || sub?.plan === "school";
  const quotaLimit = isFree ? 3 : (sub?.ai_quota_limit ?? 0);
  const isUnlimited = quotaLimit === -1;
  const used = sub?.ai_quota_used ?? 0;
  const quotaPct = isUnlimited ? 0 : Math.min((used / quotaLimit) * 100, 100);
  const quotaLeft = isUnlimited ? null : Math.max(0, quotaLimit - used);

  const graceMs = sub?.grace_period_end ? new Date(sub.grace_period_end).getTime() - Date.now() : 0;
  const graceDaysLeft: number | null = graceMs > 0 ? Math.ceil(graceMs / 86400000) : null;

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Nav */}
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#4f46e5] to-[#7C3AED] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-500/20">
              <svg width="12" height="12" viewBox="0 0 18 18" fill="none"><path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM13 12l3 3M16 12l-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className="font-bold text-[#F1F5F9]">Modulajar</span>
            {academicYear && (
              <span className="text-[10px] bg-[#4F46E5]/15 text-[#818CF8] px-2 py-0.5 rounded-full font-semibold border border-[#4F46E5]/20">
                {academicYear}
              </span>
            )}
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/modules" className="text-[#64748B] hover:text-[#E2E8F0] transition-colors">Modul</Link>
            <Link href="/journal" className="text-[#64748B] hover:text-[#E2E8F0] transition-colors">Jurnal</Link>
            <Link href="/settings" className="text-[#64748B] hover:text-[#E2E8F0] transition-colors">Pengaturan</Link>
            <form onSubmit={(e) => { e.preventDefault(); fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/")); }}>
              <button type="submit" className="text-[#334155] hover:text-[#64748B] transition-colors">Keluar</button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-7">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">{greeting}, {firstName}! 👋</h1>
          <p className="text-[#64748B] mt-1.5 text-sm">
            {isFree
              ? "Mulai buat modul pertamamu hari ini. 3× generate gratis."
              : `Kamu sudah punya ${stats.published} modul dipublikasi.`}
          </p>
        </div>

        {/* Grace period banner */}
        {graceDaysLeft !== null && graceDaysLeft > 0 && (
          <div className="bg-[#7F1D1D]/10 border border-[#EF4444]/20 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-[#EF4444]">
                Pembayaran gagal — akses penuh berakhir dalam {graceDaysLeft} hari
              </p>
              <Link href="/settings/billing" className="text-xs text-[#F87171] underline mt-0.5 inline-block">Bayar sekarang →</Link>
            </div>
          </div>
        )}

        {/* Migration banner */}
        {stats.needs_migration > 0 && (
          <div className="bg-[#78350F]/10 border border-[#F59E0B]/20 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <p className="text-sm font-semibold text-[#F59E0B]">
                {stats.needs_migration} modul perlu di-review untuk kurikulum baru
              </p>
              <Link href="/modules" className="text-xs text-[#FBBF24] underline mt-0.5 inline-block">Review sekarang →</Link>
            </div>
          </div>
        )}

        {/* CTA Row */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/modules/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#4F46E5] text-white rounded-xl font-semibold hover:bg-[#4338CA] transition-colors shadow-lg shadow-indigo-500/20"
          >
            <span className="text-lg">+</span>
            Buat Modul Baru
          </Link>
          {isPro && (
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#161B27] border border-[#21293A] text-[#E2E8F0] rounded-xl font-medium hover:bg-[#1A2030] transition-colors"
            >
              📖 Isi Jurnal
            </Link>
          )}
        </div>

        {/* Journal Streak (Pro/School only) */}
        {isPro && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#64748B]">Streak Saat Ini</span>
                <span className="text-lg">🔥</span>
              </div>
              <div className="text-3xl font-bold text-[#F59E0B]">{streak.current_streak} hari</div>
              {streak.current_streak > 0 && streak.last_journal_date && (
                <p className="text-xs text-[#475569] mt-1">
                  Terakhir: {new Date(streak.last_journal_date).toLocaleDateString("id-ID")}
                </p>
              )}
            </div>
            <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#64748B]">Streak Terpanjang</span>
                <span className="text-lg">🏆</span>
              </div>
              <div className="text-3xl font-bold text-[#818CF8]">{streak.longest_streak} hari</div>
            </div>
            <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#64748B]">Jurnal Bulan Ini</span>
                <span className="text-lg">📖</span>
              </div>
              <div className="text-3xl font-bold text-[#10B981]">{streak.this_month}×</div>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-[#161B27] rounded-xl border border-[#21293A] animate-pulse"/>
            ))
          ) : (
            <>
              <StatCard label="Draft" value={stats.draft} icon="📝" color="text-[#64748B]"/>
              <StatCard label="Dipublikasi" value={stats.published} icon="✅" color="text-[#10B981]"/>
              <StatCard label="Perlu Update" value={stats.needs_migration} icon="📋" color="text-[#F59E0B]"/>
              <StatCard label="Total Modul" value={stats.total} icon="📚" color="text-[#818CF8]"/>
            </>
          )}
        </div>

        {/* Quota bar (Free/Pro/School) */}
        {!isUnlimited && (
          <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-[#E2E8F0]">
                  {isFree ? "Kuota AI Trial" : "Kuota AI Bulan Ini"}
                </h2>
                <p className="text-sm text-[#64748B]">
                  {isFree
                    ? `${3 - used} generate tersisa dari 3× total`
                    : `Pakai ${used} dari ${quotaLimit} modul`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#818CF8]">
                  {isFree ? `${3 - used}×` : `${quotaLeft}×`}
                </span>
                <span className="text-sm text-[#475569] ml-1">{isFree ? "sisa" : "sisa"}</span>
              </div>
            </div>
            <div className="w-full bg-[#1A2030] rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  quotaPct >= 90 ? "bg-[#EF4444]" : quotaPct >= 70 ? "bg-[#F59E0B]" : "bg-[#818CF8]"
                }`}
                style={{ width: `${quotaPct}%` }}
              />
            </div>
            {quotaLeft === 0 && isPro && (
              <div className="mt-3">
                <p className="text-sm text-[#F59E0B]">Kuota habis. Upgrade untuk unlimited →</p>
              </div>
            )}
          </div>
        )}

        {/* Free tier nudge */}
        {isFree && (
          <div className="bg-gradient-to-r from-[#1E1B4B]/50 to-[#312E81]/30 rounded-xl border border-[#4F46E5]/20 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-[#E2E8F0] mb-1">Buka semua fitur dengan Pro</h2>
                <p className="text-sm text-[#64748B] mb-3 leading-relaxed">
                  Unlimited AI generate + jurnal harian + absensi + input nilai + paket bukti PMM.
                  <br />
                  <strong className="text-[#818CF8]">Rp 41.500/bulan — lebih murah dari segelas kopi.</strong>
                </p>
                <Link
                  href="/settings/billing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] text-white text-sm font-medium rounded-lg hover:bg-[#4338CA] transition-colors shadow-md shadow-indigo-500/20"
                >
                  Berlangganan Pro Rp 249.000/tahun →
                </Link>
              </div>
              <div className="text-4xl">🚀</div>
            </div>
          </div>
        )}

        {/* Recent Modules */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1A2030] flex items-center justify-between">
            <h2 className="font-semibold text-[#E2E8F0]">Modul Terbaru</h2>
            <Link href="/modules" className="text-sm text-[#818CF8] hover:underline">Lihat semua →</Link>
          </div>

          {loading ? (
            <div className="divide-y divide-[#1A2030]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-4">
                  <div className="h-4 w-48 bg-[#1A2030] rounded mb-2"/>
                  <div className="h-3 w-24 bg-[#161B27] rounded"/>
                </div>
              ))}
            </div>
          ) : recentModules.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-[#64748B] font-medium">Belum ada modul</p>
              <p className="text-[#475569] text-sm mt-1 mb-4">Mulai buat modul pertamamu</p>
              <Link href="/modules/new" className="text-[#818CF8] font-medium text-sm hover:underline">
                + Buat sekarang
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#1A2030]">
              {recentModules.map((mod) => (
                <div key={mod.id} className="px-5 py-3.5 hover:bg-[#1A2030]/50 transition-colors flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#E2E8F0] text-sm truncate">{mod.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#475569]">{mod.subject}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        mod.status === "published" ? "bg-[#10B981]/15 text-[#10B981]" : "bg-[#1A2030] text-[#64748B]"
                      }`}>
                        {mod.status === "published" ? "Dipublikasi" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <Link href={`/modules/${mod.id}/edit`} className="text-xs text-[#818CF8] font-medium hover:underline">Edit</Link>
                    <Link href={`/modules/${mod.id}`} className="text-xs text-[#475569] hover:text-[#64748B] transition-colors">Preview</Link>
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
