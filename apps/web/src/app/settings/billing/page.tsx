"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const PLAN_LIMITS: Record<string, {
  label: string; color: string; bg: string; price_idr: number;
  yearly_idr: number; ai_monthly: number;
  features: string[]; badge?: string;
}> = {
  go: {
    label: "Go", color: "#4F46E5", bg: "#1E1B4B",
    price_idr: 49000, yearly_idr: 490000, ai_monthly: 10,
    features: ["10 modul Full AI/bulan", "Download PDF tanpa watermark", "Jurnal & absensi", "Input nilai per TP", "Top-up Rp 5.000 = +3 modul"],
  },
  plus: {
    label: "Plus", color: "#F59E0B", bg: "#2D1F06",
    price_idr: 99000, yearly_idr: 990000, ai_monthly: 20,
    features: ["20 modul Full AI/bulan", "Deskripsi Nilai AI (batch)", "Prota & Promes AI", "Bank Soal AI", "Paket Bukti PMM ZIP"],
    badge: "Populer",
  },
  sekolah: {
    label: "Sekolah", color: "#10B981", bg: "#0A2918",
    price_idr: 79000, yearly_idr: 948000, ai_monthly: 25,
    features: ["25 modul/guru/bulan", "Dashboard kepala sekolah", "Invoice BOS resmi", "Semua fitur Plus", "Min 6 guru"],
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

interface Subscription {
  plan: string; status: string; ai_quota_used: number; ai_quota_limit: number;
  grace_period_end: string | null;
}
interface Payment {
  id: string; plan: string; amount: number; status: string;
  created_at: string; paid_at: string | null; billing_cycle: string;
}

function PlanCard({ planKey, plan, currentPlan, onSelect }: {
  planKey: string; plan: typeof PLAN_LIMITS[string];
  currentPlan: string | null; onSelect: (p: string, cycle: string) => void;
}) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const isCurrent = currentPlan === planKey;
  const price = cycle === "yearly" ? plan.yearly_idr : plan.price_idr;
  const saving = cycle === "yearly"
    ? Math.round((plan.price_idr * 12 - plan.yearly_idr) / 1000) * 1000
    : 0;

  return (
    <div className={`relative rounded-2xl border-2 p-5 transition-all ${isCurrent ? "border-green-400 bg-green-50" : "border-gray-200 bg-white hover:border-indigo-300"}`}>
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
          {plan.badge}
        </span>
      )}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold" style={{ color: plan.color }}>{plan.label}</h3>
        {isCurrent && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Aktif</span>}
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900">{formatIDR(price)}</div>
        <div className="text-sm text-gray-400">
          {cycle === "yearly" ? "/tahun" : "/bulan"}
          {saving > 0 && <span className="text-green-600 ml-1">· Hemat {formatIDR(saving)}</span>}
        </div>
      </div>

      {/* Billing cycle toggle */}
      <div className="flex gap-2 mb-4">
        {(["monthly", "yearly"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              cycle === c ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {c === "monthly" ? "Bulanan" : "Tahunan"}
          </button>
        ))}
      </div>

      <div className="text-xs text-indigo-600 font-medium mb-3">
        {plan.ai_monthly} modul Full AI/bulan
      </div>

      <ul className="space-y-1.5 mb-5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
            <span className="text-green-500 mt-0.5">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(planKey, cycle)}
        disabled={isCurrent}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          isCurrent
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {isCurrent ? "Plan Aktif" : "Pilih Plan"}
      </button>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-40 bg-gray-100 rounded animate-pulse" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);

  // Success/failure banners from URL params
  const success = searchParams.get("success");
  const failed = searchParams.get("failed");
  const topupSuccess = searchParams.get("topup") === "success";
  const topupFailed = searchParams.get("topup") === "failed";

  useEffect(() => {
    async function load() {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;

      const [subRes, payRes] = await Promise.all([
        fetch(`${API_URL}/api/billing/subscription`, {
          headers: { "X-User-ID": session.access_token },
        }),
        fetch(`${API_URL}/api/billing/history`, {
          headers: { "X-User-ID": session.access_token },
        }),
      ]);

      if (subRes.ok) setSub(await subRes.json() as Subscription);
      if (payRes.ok) setPayments((await payRes.json()).payments as Payment[]);
    }
    load();
  }, []);

  async function handleCheckout(plan: string, cycle: string) {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`${API_URL}/api/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": session?.access_token ?? "",
        },
        body: JSON.stringify({ plan, billing_cycle: cycle }),
      });

      if (res.ok) {
        const data = await res.json() as { payment_url: string };
        window.location.href = data.payment_url;
      } else {
        const err = await res.json() as { error: string };
        alert(`Checkout gagal: ${err.error}`);
      }
    } catch {
      alert("Checkout gagal — coba lagi");
    }
  }

  async function handleTopup() {
    const amount = parseInt(topupAmount, 10);
    if (!amount || amount < 5000) {
      alert("Minimal top-up Rp 5.000");
      return;
    }

    setTopupLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`${API_URL}/api/billing/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": session?.access_token ?? "",
        },
        body: JSON.stringify({ amount }),
      });

      if (res.ok) {
        const data = await res.json() as { payment_url: string; topup_credits: number };
        window.location.href = data.payment_url;
      } else {
        const err = await res.json() as { error: string };
        alert(`Top-up gagal: ${err.error}`);
      }
    } catch {
      alert("Top-up gagal — coba lagi");
    } finally {
      setTopupLoading(false);
    }
  }

  const used = sub?.ai_quota_used ?? 0;
  const limit = sub?.ai_quota_limit ?? 2;
  const quotaPct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const quotaLeft = Math.max(0, limit - used);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Success/error banners */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <span className="text-green-600 font-semibold">✅ Pembayaran berhasil! Plan sudah aktif.</span>
        </div>
      )}
      {failed && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <span className="text-red-600 font-semibold">❌ Pembayaran gagal atau kedaluwarsa. Silakan coba lagi.</span>
        </div>
      )}
      {topupSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <span className="text-green-600 font-semibold">✅ Top-up berhasil! Kredit sudah bertambah.</span>
        </div>
      )}
      {topupFailed && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <span className="text-red-600 font-semibold">❌ Top-up gagal. Coba lagi.</span>
        </div>
      )}

      {/* Current plan + quota */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Pengaturan Langganan</h1>
        <p className="text-sm text-gray-500">Kelola plan dan kuota AI kamu.</p>
      </div>

      {/* Quota bar */}
      {sub && sub.plan !== "free" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-900">
                Kuota AI Bulan Ini
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{sub.plan.toUpperCase()}</span>
              </h2>
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
              <button
                onClick={() => document.getElementById("topup-section")?.scrollIntoView({ behavior: "smooth" })}
                className="text-sm text-indigo-600 font-medium hover:underline"
              >
                + Top-up Rp 5.000 →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top-up section */}
      {sub && sub.plan !== "free" && (
        <div id="topup-section" className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Top-up Kuota AI</h2>
          <p className="text-xs text-gray-500 mb-3">Rp 5.000 = +3 kredit modul Full AI</p>
          <div className="flex gap-3">
            <input
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="Contoh: 10000"
              min="5000"
              step="5000"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleTopup}
              disabled={topupLoading || !topupAmount}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {topupLoading ? "Memuat..." : "Top-up"}
            </button>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(PLAN_LIMITS).map(([key, plan]) => (
            <PlanCard
              key={key}
              planKey={key}
              plan={plan}
              currentPlan={sub?.plan ?? null}
              onSelect={handleCheckout}
            />
          ))}
        </div>

        {/* Auto-renewal disclosure */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">ℹ️</span>
            <div className="text-xs text-amber-700 leading-relaxed">
              <strong>Perpanjangan otomatis:</strong> Semua paket berbayar diperpanjang secara otomatis di akhir periode. Anda dapat membatalkan kapan saja melalui menu Pengaturan → Langganan → Batalkan sebelum periode berakhir — akses tetap aktif sampai akhir periode yang sudah dibayar.{" "}
              <a href="/refund" className="underline font-medium">Kebijakan refund</a>.
            </div>
          </div>
        </div>
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Riwayat Pembayaran</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Jumlah</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(pay.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900 capitalize">
                    {pay.plan} ({pay.billing_cycle === "yearly" ? "Tahunan" : "Bulanan"})
                  </td>
                  <td className="px-5 py-3 text-gray-700">{formatIDR(pay.amount)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      pay.status === "paid" ? "bg-green-100 text-green-700" :
                      pay.status === "pending" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {pay.status === "paid" ? "Lunas" : pay.status === "pending" ? "Menunggu" : "Gagal"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Free tier info */}
      {(!sub || sub.plan === "free") && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Plan Free</h2>
          <p className="text-sm text-gray-500">
            Kamu saat ini di plan Free. 2 modul/bulan, tidak bisa download PDF.
            Upgrade ke Go mulai Rp 49.000/bulan.
          </p>
        </div>
      )}
    </div>
  );
}