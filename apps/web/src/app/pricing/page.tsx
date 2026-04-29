"use client";
import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    key: "free",
    name: "Free",
    tagline: "Untuk coba-coba",
    color: "#6b7280",
    border: "border-gray-200",
    badge: null,
    monthly: 0,
    yearly: 0,
    aiLabel: "2 modul/bulan",
    features: [
      "2 modul Full AI/bulan",
      "Preview modul",
      "Scratch editor",
      "Export HTML",
    ],
    cta: "Mulai Gratis",
    ctaClass: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ctaHref: "/register",
    limitNote: null,
  },
  {
    key: "go",
    name: "Go",
    tagline: "Untuk guru aktif",
    color: "#4f46e5",
    border: "border-indigo-300",
    badge: "Populer",
    monthly: 49000,
    yearly: 490000,
    aiLabel: "10 modul/bulan",
    features: [
      "10 modul Full AI/bulan",
      "Download PDF tanpa watermark",
      "Jurnal & absensi harian",
      "Input nilai per TP",
      "Top-up Rp 5.000 = +3 modul",
      "Semua fitur Free",
    ],
    cta: "Pilih Go",
    ctaClass: "bg-indigo-600 text-white hover:bg-indigo-700",
    ctaHref: "/register?plan=go",
    limitNote: "Hemat Rp 98.000/tahun",
  },
  {
    key: "plus",
    name: "Plus",
    tagline: "Untuk guru profesional",
    color: "#f59e0b",
    border: "border-amber-300",
    badge: null,
    monthly: 99000,
    yearly: 990000,
    aiLabel: "20 modul/bulan",
    features: [
      "20 modul Full AI/bulan",
      "Download PDF tanpa watermark",
      "Deskripsi Nilai AI (batch)",
      "Prota & Promes AI",
      "Bank Soal AI",
      "Paket Bukti PMM ZIP",
      "Semua fitur Go",
    ],
    cta: "Pilih Plus",
    ctaClass: "bg-gray-900 text-white hover:bg-gray-800",
    ctaHref: "/register?plan=plus",
    limitNote: "Hemat Rp 198.000/tahun",
  },
];

const FAQS = [
  {
    q: "Apakah bisa cancel kapan saja?",
    a: "Ya. Pembatalan berlaku untuk periode berikutnya — kamu tetap akses sampai periode berakhir. Tidak ada biaya tersembunyi.",
  },
  {
    q: "Apa bedanya bulanan dan tahunan?",
    a: "Paket tahunan memberikan diskon ~17% dibanding bulanan. Kalau plan Go bulanan Rp 49.000/bulan × 12 = Rp 588.000, sedangkan tahunan hanya Rp 490.000.",
  },
  {
    q: "Bagaimana jika kuota saya habis di tengah bulan?",
    a: "Kamu bisa top-up Rp 5.000 untuk +3 modul. Atau upgrade ke plan lebih tinggi. Kuota reset setiap tanggal 1.",
  },
  {
    q: "Apakah ada uang kembali jika tidak cocok?",
    a: "Lihat Kebijakan Refund kami. Secara umum pembayaran non-refundable karena layanan langsung aktif. Hubungi hello@modulajar.app untuk kasus khusus.",
  },
  {
    q: "Apakah bisa pakai invoice BOS?",
    a: "Plan Sekolah mendukung invoice BOS resmi dengan NPWP sekolah. Minimum 6 guru. Hubungi hello@modulajar.app untuk informasi lengkap.",
  },
];

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function PlanCard({ plan, cycle, annualSaving }: {
  plan: typeof PLANS[number];
  cycle: "monthly" | "yearly";
  annualSaving: number;
}) {
  const price = cycle === "yearly" ? plan.yearly : plan.monthly;
  const monthlyEquiv = cycle === "yearly" ? Math.round(plan.yearly / 12) : plan.monthly;
  const isYearly = cycle === "yearly";
  const isHighlight = plan.key === "go";

  return (
    <div className={`relative rounded-2xl p-6 flex flex-col ${isHighlight ? "bg-indigo-50 border-2 border-indigo-400 shadow-md" : `bg-white border ${plan.border}`}`}>
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
          {plan.badge}
        </div>
      )}

      <div className={`text-lg font-bold mb-0.5`} style={{ color: plan.color }}>{plan.name}</div>
      <div className="text-xs text-gray-500 mb-4">{plan.tagline}</div>

      <div className="mb-1">
        {plan.key === "free" ? (
          <div className="text-3xl font-bold text-gray-900">{formatIDR(0)}</div>
        ) : (
          <div className="text-3xl font-bold text-gray-900">{formatIDR(monthlyEquiv)}</div>
        )}
        <div className="text-sm text-gray-400 mb-1">
          {plan.key === "free" ? "/bulan" : isYearly ? "/bulan" : "/bulan"}
          {plan.key !== "free" && isYearly && (
            <span className="text-green-600 ml-1 font-medium">· Hemat {formatIDR(annualSaving)}</span>
          )}
        </div>
        {plan.key !== "free" && isYearly && (
          <div className="text-xs text-gray-400 mb-3">atau {formatIDR(price)}/tahun</div>
        )}
      </div>

      <div className="text-xs font-semibold text-indigo-600 mb-4 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
        {plan.aiLabel}
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={plan.ctaHref}
        className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-colors ${plan.ctaClass}`}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

export default function PricingPage() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-gray-900">Modulajar</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/help" className="text-gray-500 hover:text-gray-900">Bantuan</Link>
            <Link href="/login" className="text-gray-500 hover:text-gray-900">Masuk</Link>
            <Link href="/register" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700">
              Mulai Gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          💰 Harga transparan — tanpa biaya tersembunyi
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Paket Berlangganan<br />
          <span className="text-indigo-600">yang Sesuai Kebutuhan</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Mulai gratis — upgrade kapan saja. Batalkan kapan saja. Tidak ada biaya tersembunyi.
        </p>

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setCycle("monthly")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              cycle === "monthly"
                ? "bg-indigo-100 text-indigo-700 font-semibold"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setCycle("yearly")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors relative ${
              cycle === "yearly"
                ? "bg-indigo-600 text-white font-semibold"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Tahunan
            <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Hemat 17%</span>
          </button>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              cycle={cycle}
              annualSaving={
                plan.key === "go" ? 98000 :
                plan.key === "plus" ? 198000 : 0
              }
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Semua harga sudah termasuk PPN 11%.{" "}
            <Link href="/help" className="text-indigo-600 hover:underline">Pertanyaan? Hubungi kami</Link>
          </p>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Perbandingan Fitur</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-4 font-semibold w-1/2">Fitur</th>
                  <th className="px-4 py-4 text-center font-semibold">Free</th>
                  <th className="px-4 py-4 text-center font-semibold text-indigo-700">Go</th>
                  <th className="px-4 py-4 text-center font-semibold text-amber-600">Plus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Modul AI per bulan", "2", "10", "20"],
                  ["Generate Full AI", "✓", "✓", "✓"],
                  ["Preview modul", "✓", "✓", "✓"],
                  ["Scratch editor", "✓", "✓", "✓"],
                  ["Download PDF", "✗", "✓", "✓"],
                  ["PDF tanpa watermark", "✗", "✓", "✓"],
                  ["Jurnal mengajar", "✗", "✓", "✓"],
                  ["Absensi siswa", "✗", "✓", "✓"],
                  ["Input nilai per TP", "✗", "✓", "✓"],
                  ["Top-up modul", "✗", "✓", "✓"],
                  ["Deskripsi Nilai AI", "✗", "✗", "✓"],
                  ["Prota & Promes AI", "✗", "✗", "✓"],
                  ["Bank Soal AI", "✗", "✗", "✓"],
                  ["Paket Bukti PMM ZIP", "✗", "✗", "✓"],
                  ["Billing cycle", "Bulanan", "Bulanan/Tahunan", "Bulanan/Tahunan"],
                ].map(([feature, free, go, plus]) => (
                  <tr key={feature} className="hover:bg-gray-50">
                    <td className="px-6 py-3.5 text-gray-700">{feature}</td>
                    <td className="px-4 py-3.5 text-center text-gray-400">{free}</td>
                    <td className="px-4 py-3.5 text-center text-green-600 font-medium bg-indigo-50/30">{go}</td>
                    <td className="px-4 py-3.5 text-center text-green-600 font-medium bg-amber-50/30">{plus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Pertanyaan Umum</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl px-5 py-4">
                <div className="font-semibold text-gray-900 text-sm mb-1">{faq.q}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{faq.a}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            Ada pertanyaan lain?{" "}
            <a href="mailto:hello@modulajar.app" className="text-indigo-600 hover:underline font-medium">
              Hubungi kami
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Siap membuat modul ajar?</h2>
          <p className="text-indigo-200 mb-8 max-w-xl mx-auto">
            Bergabung dengan ribuan guru Indonesia yang sudah membuat modul ajar Kurikulum Merdeka dalam hitungan menit.
          </p>
          <Link
            href="/register"
            className="inline-flex px-8 py-3.5 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
          >
            Buat Modul Gratis →
          </Link>
          <p className="text-indigo-300 text-xs mt-4">Tanpa kartu kredit · 2 modul gratis/bulan</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">M</div>
              <span className="font-bold text-gray-900 text-sm">Modulajar</span>
            </div>
            <div className="flex gap-6 text-xs text-gray-400">
              <Link href="/terms" className="hover:text-gray-600">Syarat</Link>
              <Link href="/privacy" className="hover:text-gray-600">Privasi</Link>
              <Link href="/refund" className="hover:text-gray-600">Refund</Link>
              <Link href="/help" className="hover:text-gray-600">Bantuan</Link>
            </div>
            <p className="text-xs text-gray-400">© 2026 CV. Artesis Sinar Endah Perdana</p>
          </div>
        </div>
      </footer>
    </div>
  );
}