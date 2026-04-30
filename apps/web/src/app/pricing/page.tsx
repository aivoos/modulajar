"use client";
import Link from "next/link";

const PLANS = [
  {
    key: "free",
    name: "Free",
    tagline: "Untuk coba",
    color: "#6B7280",
    border: "border-gray-200",
    badge: null,
    price: 0,
    period: "selamanya",
    aiLabel: "3× generate AI (total)",
    features: [
      "3× generate modul AI (total seumur hidup)",
      "Preview di aplikasi",
      "Akses curated library (baca saja)",
    ],
    locked: [
      "Download PDF",
      "Jurnal Harian",
      "Input Nilai",
      "Paket Bukti PMM",
    ],
    cta: "Mulai Gratis",
    ctaClass: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ctaHref: "/register",
    limitsNote: "3× lifetime — setelah itu upgrade",
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "Untuk guru aktif",
    color: "#2563EB",
    border: "border-blue-300",
    badge: "Populer",
    priceMonthly: 99_000,
    price6mo: 494_000,
    priceYearly: 790_000,
    period: "/bulan",
    aiLabel: "30× AI generate/bulan",
    features: [
      "30× AI generate modul/bulan (GPT-4o mini)",
      "Download PDF (A4, siap cetak)",
      "Jurnal Harian (harian, 60 detik)",
      "Absensi siswa per kelas",
      "Input Nilai + Deskripsi AI",
      "Paket Bukti PMM (ZIP untuk upload ke PMM)",
      "Push notification reminder jurnal",
    ],
    locked: [],
    cta: "Berlangganan Pro",
    ctaClass: "bg-blue-600 text-white hover:bg-blue-700",
    ctaHref: "/register?plan=pro",
    anchor: "Rp 99.000/bulan — lebih murah dari segelas kopi",
  },
  {
    key: "school",
    name: "Sekolah",
    tagline: "Untuk sekolah (B2B)",
    color: "#22C55E",
    border: "border-green-300",
    badge: null,
    priceYearly: null,  // tiered — no single price
    period: "per guru / bulan",
    tiers: [
      { label: "3-10 guru",   price: 89_000, per: "guru/bulan",  yearlyPerGuru: 1_068_000 },
      { label: "11-25 guru",  price: 79_000, per: "guru/bulan",  yearlyPerGuru:   948_000 },
      { label: "26-50 guru",  price: 69_000, per: "guru/bulan",  yearlyPerGuru:   828_000 },
      { label: "51-100 guru", price: 59_000, per: "guru/bulan",  yearlyPerGuru:   708_000 },
      { label: "100+ guru",   price: 49_000, per: "guru/bulan",  yearlyPerGuru:   588_000, custom: true },
    ],
    minGuru: 3,
    aiLabel: "30× AI generate/guru/bulan",
    features: [
      "Semua fitur Pro untuk semua guru",
      "Dashboard Kepala Sekolah",
      "Upload master jadwal sekolah",
      "Laporan compliance kurikulum semua guru",
      "Invoice resmi BOS (NPWP, PPN 11%)",
      "Onboarding guru oleh tim kami",
      "School invite: kepala sekolah invite guru",
    ],
    locked: [],
    cta: "Hubungi Kami",
    ctaClass: "bg-green-600 text-white hover:bg-green-700",
    ctaHref: "mailto:hello@modulajar.app?subject=Plan%20Sekolah",
    anchor: "Mulai Rp 49.000/guru/bulan — 51% lebih murah dari Pro",
  },
];

const FAQS = [
  {
    q: "Apakah bisa cancel kapan saja?",
    a: "Ya. Pembatalan berlaku untuk periode berikutnya — kamu tetap akses sampai periode berakhir. Tidak ada biaya tersembunyi.",
  },
  {
    q: "Berapa lama masa percobaan gratis?",
    a: "3× generate AI sudah cukup untuk rasakan value. Setelah itu upgrade ke Pro untuk akses unlimited.",
  },
  {
    q: "Apakah bisa pakai invoice BOS?",
    a: "Plan Sekolah mendukung invoice BOS resmi dengan NPWP sekolah dan PPN 11%. Minimum 3 guru. Hubungi hello@modulajar.app.",
  },
  {
    q: "Berapa guru minimum untuk plan Sekolah?",
    a: "Minimum 3 guru. Harga Rp 1.499.000/tahun untuk maks 30 guru. Kalau sekolah tambah guru, NRR > 100% karena biaya per guru turun.",
  },
  {
    q: "Apakah ada uang kembali jika tidak cocok?",
    a: "Lihat Kebijakan Refund kami. Pembayaran non-refundable karena layanan langsung aktif. Hubungi hello@modulajar.app untuk kasus khusus.",
  },
  {
    q: "Bagaimana cara referral bekerja?",
    a: "Dapat 10% dari pembayaran pertama teman yang kamu ajak, plus 5% recurring selama 12 bulan. Pencairan mingguan, minimal Rp 50.000.",
  },
];

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function PlanCard({ plan }: { plan: (typeof PLANS)[number] }) {
  const isHighlight = plan.key === "pro";
  const isSchool = plan.key === "school";
  const isFree = plan.key === "free";

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 ${
        isHighlight
          ? "bg-blue-50 border-2 border-blue-400 shadow-md"
          : isSchool
          ? "bg-white border-2 border-green-300"
          : `bg-white border ${plan.border}`
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
          {plan.badge}
        </div>
      )}

      <div className="text-lg font-bold mb-0.5" style={{ color: plan.color }}>
        {plan.name}
      </div>
      <div className="text-xs text-gray-500 mb-4">{plan.tagline}</div>

      {/* Free */}
      {isFree && (
        <div className="mb-2">
          <div className="text-3xl font-bold text-gray-900">{formatIDR(0)}</div>
          <div className="text-sm text-gray-400">{plan.period}</div>
        </div>
      )}

      {/* Pro — show monthly as anchor, with 6mo & annual options */}
      {plan.key === "pro" && (
        <div className="mb-2">
          <div className="text-3xl font-bold text-gray-900">{formatIDR((plan as { priceMonthly?: number }).priceMonthly ?? 0)}</div>
          <div className="text-sm text-gray-400 mb-1">{plan.period}</div>
          <div className="text-xs text-gray-400 space-y-0.5 mt-2">
            <div>atau {formatIDR((plan as { price6mo: number }).price6mo)} / 6 bulan</div>
            <div>atau {formatIDR((plan as { priceYearly: number }).priceYearly)} / tahun</div>
          </div>
        </div>
      )}

      {/* School — show tier table */}
      {isSchool && plan.tiers && (
        <div className="mb-2 space-y-1">
          {plan.tiers.map((tier) => (
            <div key={tier.label} className="flex justify-between items-center text-xs">
              <span className="text-gray-600">{tier.label}</span>
              <span className="font-semibold text-gray-900">
                {formatIDR(tier.price)}<span className="text-gray-400 font-normal">/{tier.per}</span>
              </span>
            </div>
          ))}
          <div className="text-xs text-gray-400 pt-1">Minimum {plan.minGuru} guru</div>
        </div>
      )}

      {plan.anchor && (
        <div className="text-xs text-blue-600 font-semibold mb-4 bg-blue-100 px-3 py-1.5 rounded-lg">
          {plan.anchor}
        </div>
      )}

      <div className="text-xs font-semibold text-indigo-600 mb-4 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
        {plan.aiLabel}
      </div>

      <ul className="space-y-2.5 mb-4 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
        {plan.locked.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
            <span className="mt-0.5 flex-shrink-0">✗</span>
            {f}
          </li>
        ))}
        {"limitsNote" in plan && plan.limitsNote && (
          <li className="text-xs text-red-500 bg-red-50 px-2 py-1.5 rounded-lg">
            ⚠️ {plan.limitsNote}
          </li>
        )}
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
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="font-bold text-gray-900">Modulajar</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/help" className="text-gray-500 hover:text-gray-900">
              Bantuan
            </Link>
            <Link href="/login" className="text-gray-500 hover:text-gray-900">
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700"
            >
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
          <span className="text-indigo-600">Tahunan Saja</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Satu keputusan per tahun — lebih mudah daripada 12 keputusan bulanan. Mulai gratis,
          upgrade kapan saja.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <PlanCard key={plan.key} plan={plan} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Semua harga sudah termasuk PPN 11%.{" "}
            <Link href="/help" className="text-indigo-600 hover:underline">
              Pertanyaan? Hubungi kami
            </Link>
          </p>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Perbandingan Fitur
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-4 font-semibold w-1/2">Fitur</th>
                  <th className="px-4 py-4 text-center font-semibold">Free</th>
                  <th className="px-4 py-4 text-center font-semibold text-blue-700">Pro</th>
                  <th className="px-4 py-4 text-center font-semibold text-green-700">Sekolah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["AI generate modul",  "3× (lifetime)",  "30×/bulan",    "30×/guru/bulan"],
                  ["Download PDF",       "✗",               "✓",            "✓"],
                  ["Jurnal Harian",      "✗",               "✓",            "✓"],
                  ["Absensi siswa",      "✗",               "✓",            "✓"],
                  ["Input Nilai",        "✗",               "✓",            "✓"],
                  ["Deskripsi Nilai AI", "✗",               "✓",            "✓"],
                  ["Paket Bukti PMM ZIP", "✗",               "✓",            "✓"],
                  ["Curated library",    "Baca saja",       "Baca saja",    "Baca saja"],
                  ["Billing",           "Gratis",          "Bulanan/Tahunan","Per guru/bulan"],
                  ["Referral bonus",     "✗",               "✓",            "✓"],
                  ["School invite",      "✗",               "✗",            "✓"],
                ].map(([feature, free, pro, school]) => (
                  <tr key={feature} className="hover:bg-gray-50">
                    <td className="px-6 py-3.5 text-gray-700">{feature}</td>
                    <td className="px-4 py-3.5 text-center text-gray-400">{free}</td>
                    <td className="px-4 py-3.5 text-center text-green-600 font-medium bg-blue-50/30">
                      {pro}
                    </td>
                    <td className="px-4 py-3.5 text-center text-green-600 font-medium bg-green-50/30">
                      {school}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Referral */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-indigo-50 rounded-2xl p-8 text-center">
            <div className="text-2xl mb-3">🎁</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ajak Teman, Dapat Bonus</h2>
            <p className="text-sm text-gray-600 mb-4 max-w-lg mx-auto leading-relaxed">
              Dapat <strong>10%</strong> dari pembayaran pertama teman yang kamu ajak, plus{" "}
              <strong>5% recurring</strong> selama 12 bulan setiap kali mereka perpanjang langganan.
              Pencairan mingguan, minimal Rp 50.000.
            </p>
            <Link
              href="/register"
              className="inline-flex px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Mulai Ajak Teman →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Pertanyaan Umum
          </h2>
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
            <a
              href="mailto:hello@modulajar.app"
              className="text-indigo-600 hover:underline font-medium"
            >
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
            Bergabung dengan ribuan guru Indonesia yang sudah membuat modul ajar Kurikulum Merdeka
            dalam hitungan menit.
          </p>
          <Link
            href="/register"
            className="inline-flex px-8 py-3.5 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
          >
            Buat Modul Gratis →
          </Link>
          <p className="text-indigo-300 text-xs mt-4">
            Tanpa kartu kredit · 3× generate AI gratis
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">
                M
              </div>
              <span className="font-bold text-gray-900 text-sm">Modulajar</span>
            </div>
            <div className="flex gap-6 text-xs text-gray-400">
              <Link href="/terms" className="hover:text-gray-600">
                Syarat
              </Link>
              <Link href="/privacy" className="hover:text-gray-600">
                Privasi
              </Link>
              <Link href="/refund" className="hover:text-gray-600">
                Refund
              </Link>
              <Link href="/help" className="hover:text-gray-600">
                Bantuan
              </Link>
            </div>
            <p className="text-xs text-gray-400">© 2026 CV. Artesis Sinar Endah Perdana</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
