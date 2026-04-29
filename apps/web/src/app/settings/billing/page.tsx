"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const PLANS: Record<string, {
  label: string; color: string; bg: string;
  price_idr: number; price_alt_idr?: number; period: string; period_alt?: string;
  ai_quota: string; features: string[];
  badge?: string;
}> = {
  free: {
    label: "Free", color: "#6B7280", bg: "#F9FAFB",
    price_idr: 0, period: "selamanya",
    ai_quota: "3× generate AI (total)",
    features: ["3× generate modul AI (lifetime)", "Preview di aplikasi", "Akses curated library"],
  },
  pro: {
    label: "Pro", color: "#2563EB", bg: "#EFF6FF",
    price_idr: 249_000, price_alt_idr: 149_000,
    period: "/tahun", period_alt: "/6 bulan",
    ai_quota: "Unlimited AI generate",
    features: ["Unlimited AI generate (GPT-4o mini)", "Download PDF (A4, siap cetak)", "Jurnal Harian", "Absensi siswa", "Input Nilai + Deskripsi AI", "Paket Bukti PMM ZIP", "Push notification jurnal"],
    badge: "Populer",
  },
  school: {
    label: "Sekolah", color: "#22C55E", bg: "#F0FDF4",
    price_idr: 1_499_000, period: "/tahun",
    ai_quota: "Unlimited · Maks 30 guru",
    features: ["Semua fitur Pro", "Dashboard Kepala Sekolah", "Upload master jadwal", "Laporan compliance guru", "Invoice BOS resmi (NPWP, PPN 11%)", "Onboarding oleh tim kami"],
    badge: "B2B",
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

interface Subscription {
  plan: string;
  status: string;
  ai_quota_used: number;
  ai_quota_limit: number;
  grace_period_end: string | null;
  current_period_end: string | null;
}
interface Payment {
  id: string;
  plan: string;
  amount_idr: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  invoice_url: string | null;
}

function PlanCard({
  planKey,
  plan,
  currentPlan,
  onSelect,
}: {
  planKey: string;
  plan: (typeof PLANS)[string];
  currentPlan: string | null;
  onSelect: (p: string) => void;
}) {
  const isCurrent = currentPlan === planKey;
  const isFree = planKey === "free";

  return (
    <div
      className={`relative rounded-2xl border-2 p-5 transition-all ${
        isCurrent
          ? "border-green-400 bg-green-50"
          : planKey === "pro"
          ? "border-blue-400 bg-blue-50"
          : planKey === "school"
          ? "border-green-300 bg-white"
          : "border-gray-200 bg-white hover:border-indigo-300"
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
          {plan.badge}
        </span>
      )}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold" style={{ color: plan.color }}>
          {plan.label}
        </h3>
        {isCurrent && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Aktif
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900">
          {isFree ? formatIDR(0) : formatIDR(plan.price_idr)}
        </div>
        <div className="text-sm text-gray-400">{plan.period}</div>
        {!isFree && plan.price_alt_idr && (
          <div className="text-xs text-gray-400 mt-1">
            atau {formatIDR(plan.price_alt_idr)} {plan.period_alt}
          </div>
        )}
      </div>

      <div className="text-xs text-indigo-600 font-medium mb-3">{plan.ai_quota}</div>

      <ul className="space-y-1.5 mb-5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>

      {planKey === "school" ? (
        <a
          href="mailto:hello@modulajar.app?subject=Plan%20Sekolah"
          className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          Hubungi Kami
        </a>
      ) : (
        <button
          onClick={() => onSelect(planKey)}
          disabled={isCurrent}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            isCurrent
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isFree
              ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isCurrent ? "Plan Aktif" : isFree ? "Plan Saat Ini" : "Berlangganan"}
        </button>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-40 bg-gray-100 rounded animate-pulse" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Success/failure banners from URL params
  const success = searchParams.get("success");
  const failed = searchParams.get("failed");

  useEffect(() => {
    async function load() {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;

      const [subRes, payRes] = await Promise.all([
        fetch(`${API_URL}/api/billing/subscription`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${API_URL}/api/billing/history`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (subRes.ok) setSub(await subRes.json() as Subscription);
      if (payRes.ok) setPayments((await payRes.json()).payments as Payment[]);
    }
    load();
  }, []);

  async function handleCheckout(plan: string) {
    if (plan === "free") return;

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`${API_URL}/api/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ plan }),
      });

      if (res.ok) {
        const data = (await res.json()) as { payment_url: string };
        window.location.href = data.payment_url;
      } else {
        const err = (await res.json()) as { error: string };
        alert(`Checkout gagal: ${err.error}`);
      }
    } catch {
      alert("Checkout gagal — coba lagi");
    }
  }

  const used = sub?.ai_quota_used ?? 0;
  const limit = sub?.ai_quota_limit ?? 0;
  const isUnlimited = limit === -1;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Success/error banners */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <span className="text-green-600 font-semibold">
            ✅ Pembayaran berhasil! Plan sudah aktif.
          </span>
        </div>
      )}
      {failed && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <span className="text-red-600 font-semibold">
            ❌ Pembayaran gagal atau kedaluwarsa. Silakan coba lagi.
          </span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Pengaturan Langganan</h1>
        <p className="text-sm text-gray-500">
          Kelola plan langganan kamu. Semua plan {sub?.current_period_end && new Date(sub.current_period_end) > new Date() ? "tahunan" : "harian"} — tidak ada pilihan bulanan.
        </p>
      </div>

      {/* Current plan + quota (Pro/School only) */}
      {sub && sub.plan !== "free" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-900">
                Plan Aktif
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium uppercase">
                  {sub.plan}
                </span>
              </h2>
              <p className="text-sm text-gray-500">
                {isUnlimited
                  ? "AI generate unlimited"
                  : `Pakai ${used} dari ${limit} modul`}
              </p>
            </div>
            {sub.current_period_end && (
              <div className="text-right text-xs text-gray-500">
                <div>Berakhir</div>
                <div className="font-medium text-gray-700">
                  {new Date(sub.current_period_end).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            )}
          </div>

          {!isUnlimited && limit > 0 && (
            <>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (used / limit) >= 0.9
                      ? "bg-red-500"
                      : (used / limit) >= 0.7
                      ? "bg-amber-500"
                      : "bg-indigo-600"
                  }`}
                  style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {limit - used} modul tersisa bulan ini
              </p>
            </>
          )}

          {isUnlimited && (
            <div className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg mt-1">
              <span className="text-green-600">∞</span>
              Unlimited AI generate
            </div>
          )}

          {sub.grace_period_end && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
              <span>ℹ️</span>
              <span>
                Grace period aktif sampai{" "}
                {new Date(sub.grace_period_end).toLocaleDateString("id-ID")} — akses
                tetap berjalan.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Free tier — show upgrade prompt */}
      {(!sub || sub.plan === "free") && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-blue-200 p-5">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🚀</div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 mb-1">Kamu di Plan Free</h2>
              <p className="text-sm text-gray-600 mb-3">
                3× generate AI sudah dipakai. Upgrade ke Pro untuk unlimited AI generate + semua
                fitur: jurnal harian, absensi siswa, input nilai, dan paket bukti PMM.
              </p>
              <div className="text-xs text-indigo-600 font-semibold">
                Rp 41.500/bulan — lebih murah dari segelas kopi
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(PLANS).map(([key, plan]) => (
            <PlanCard
              key={key}
              planKey={key}
              plan={plan}
              currentPlan={sub?.plan ?? null}
              onSelect={handleCheckout}
            />
          ))}
        </div>

        {/* Annual-only disclosure */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">ℹ️</span>
            <div className="text-xs text-amber-700 leading-relaxed">
              <strong>Semua plan tahunan.</strong> Tidak ada pilihan bulanan. Pro Rp 249.000/tahun
              (ekuivalen Rp 20.750/bulan) atau Rp 149.000/6 bulan. Perpanjangan otomatis di akhir
              periode — batalkan kapan saja tanpa biaya tambahan.{" "}
              <a href="/refund" className="underline font-medium">
                Kebijakan refund
              </a>
              .
            </div>
          </div>
        </div>
      </div>

      {/* Referral info */}
      {sub && sub.plan !== "free" && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-5">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🎁</div>
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Ajak Teman, Dapat Bonus</h2>
              <p className="text-sm text-gray-600 mb-2">
                Dapat <strong>10%</strong> dari pembayaran pertama teman yang kamu ajak, plus{" "}
                <strong>5% recurring</strong> selama 12 bulan setiap kali mereka perpanjang. Pencairan
                mingguan, minimal Rp 50.000.
              </p>
              <a
                href="/referral"
                className="text-xs text-indigo-600 font-medium hover:underline"
              >
                Lihat kode referral →
              </a>
            </div>
          </div>
        </div>
      )}

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
                <th className="px-5 py-3">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(pay.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900 uppercase">{pay.plan}</td>
                  <td className="px-5 py-3 text-gray-700">{formatIDR(pay.amount_idr)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        pay.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : pay.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {pay.status === "paid" ? "Lunas" : pay.status === "pending" ? "Menunggu" : "Gagal"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {pay.invoice_url ? (
                      <a
                        href={pay.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Unduh
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}