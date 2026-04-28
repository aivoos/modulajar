"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [sub, setSub] = useState<{
    plan: string; status: string; ai_quota_used: number;
    ai_quota_limit: number; grace_days_remaining: number | null;
  } | null>(null);
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const name = (authUser.user_metadata?.full_name as string | undefined) ?? "";
      setUser({ full_name: name, email: authUser.email ?? "" });
      setFullName(name);

      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status, ai_quota_used, ai_quota_limit")
        .eq("user_id", authUser.id)
        .single();

      if (data) setSub({ ...data, grace_days_remaining: null });
    }
    load();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setSaveMsg({ type: "error", text: "Tidak terautentikasi" });
      setSaving(false);
      return;
    }

    // Update auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    if (authError) {
      setSaveMsg({ type: "error", text: authError.message });
      setSaving(false);
      return;
    }

    // Update users table profile
    const { error: profileError } = await supabase
      .from("users")
      .update({ full_name: fullName })
      .eq("id", authUser.id);

    if (profileError) {
      setSaveMsg({ type: "error", text: profileError.message });
    } else {
      setSaveMsg({ type: "success", text: "Profil berhasil disimpan!" });
      setUser({ ...user!, full_name: fullName });
    }
    setSaving(false);
  }

  const PLAN_PRICES: Record<string, string> = {
    free: "Gratis", go: "Rp 49.000/bulan", plus: "Rp 99.000/bulan", sekolah: "Rp 79.000/guru/bulan (min 6 guru)",
  };

  const quotaPct = sub
    ? sub.plan === "free"
      ? 0
      : sub.ai_quota_limit > 0
        ? (sub.ai_quota_used / sub.ai_quota_limit) * 100
        : 0
    : 0;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>

      {/* Plan Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Plan Saat Ini</h2>
            <p className="text-sm text-gray-500 mt-0.5">{PLAN_PRICES[sub?.plan ?? "free"]}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            sub?.status === "active" ? "bg-green-100 text-green-700"
            : sub?.status === "past_due" ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-600"
          }`}>
            {sub?.status === "active" ? "✓ Aktif" : (sub?.status ?? "free").toUpperCase()}
          </span>
        </div>

        {/* Quota bar */}
        {sub && sub.plan !== "free" && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Kuota AI bulan ini</span>
              <span>{sub!.ai_quota_used} / {sub!.ai_quota_limit} modul</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min(quotaPct, 100)}%` }}
              />
            </div>
          </div>
        )}

        {sub?.plan === "free" && (
          <div className="mb-4 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-700">
            Upgrade ke <b>Go</b> untuk akses Full AI + download PDF tanpa watermark.
          </div>
        )}

        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline"
        >
          {sub?.plan === "free" ? "Upgrade sekarang →" : "Kelola langganan →"}
        </Link>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Profil</h2>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nama</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              type="email"
              defaultValue={user?.email ?? ""}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400"
            />
          </div>
          {saveMsg && (
            <div className={`text-sm px-3 py-2 rounded-lg ${saveMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {saveMsg.text}
            </div>
          )}
          <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>
    </div>
  );
}