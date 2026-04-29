import Link from "next/link";

// Minimal static landing page — no client deps needed for shell
export const metadata = {
  title: "Modulajar — Buat Modul Ajar Kurikulum Merdeka dalam Menit",
  description: "Platform AI untuk guru Indonesia. Buat modul ajar Kurikulum Merdeka lengkap dalam 60 detik. CP, TP, ATP, Kegiatan, dan Asesmen otomatis.",
};

const FAQ_DATA = [
  { question: "Apakah gratis?", answer: "Plan Free memberikan 2 modul/bulan gratis tanpa perlu bayar." },
  { question: "Berapa biaya langganan?", answer: "Plan Go mulai Rp 49.000/bulan untuk 10 modul Full AI." },
  { question: "Apakah modul hasil AI akurat?", answer: "AI menghasilkan draft yang harus direview guru. Hasil tidak dijamin 100% akurat." },
  { question: "Bisa offline?", answer: "Fitur dasar bisa offline lewat PWA. Generate AI butuh internet." },
];

const LANDING_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://modulajar.app/#organization",
      name: "Modulajar",
      url: "https://modulajar.app",
      logo: "https://modulajar.app/favicon.svg",
      sameAs: ["https://twitter.com/modulajar"],
      contactPoint: {
        "@type": "ContactPoint",
        email: "hello@modulajar.app",
        contactType: "customer support",
        availableLanguage: "Indonesian",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "Jl. Sudirman No. 123",
        addressLocality: "Jakarta Pusat",
        postalCode: "10220",
        addressCountry: "ID",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://modulajar.app/#app",
      name: "Modulajar",
      applicationCategory: "EducationApplication",
      operatingSystem: "Web",
      url: "https://modulajar.app",
      description: "Platform AI untuk guru Indonesia membuat modul ajar Kurikulum Merdeka dalam 60 detik.",
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "IDR" },
        { "@type": "Offer", name: "Go", price: "49000", priceCurrency: "IDR", billingIncrement: "1", frequency: "P1M" },
        { "@type": "Offer", name: "Plus", price: "99000", priceCurrency: "IDR", billingIncrement: "1", frequency: "P1M" },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "342",
        bestRating: "5",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://modulajar.app/#faq",
      mainEntity: FAQ_DATA.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ],
};

const FAQS = [
  { q: "Apakah gratis?", a: "Plan Free memberikan 2 modul/bulan gratis tanpa perlu bayar." },
  { q: "Berapa biaya langganan?", a: "Plan Go mulai Rp 49.000/bulan untuk 10 modul Full AI." },
  { q: "Apakah modul hasil AI akurat?", a: "AI menghasilkan draft yang harus direview guru. Hasil tidak dijamin 100% akurat." },
  { q: "Bisa offline?", a: "Fitur dasar bisa offline lewat PWA. Generate AI butuh internet." },
];

const STEPS = [
  { n: "1", title: "Pilih Mapel & Fase", desc: "Matematika, IPA, Bahasa Indonesia — pilih fase A sampai F sesuai kelas." },
  { n: "2", title: "Generate dengan AI", desc: "CP, Tujuan Pembelajaran, ATP, dan Asesmen dibuat otomatis dalam 60 detik." },
  { n: "3", title: "Edit & Publish", desc: "Edit bagian yang perlu penyesuaian, lalu publish atau export PDF." },
];

const FEATURES = [
  { icon: "⚡", title: "Generate dalam 60 Detik", desc: "Capaian Pembelajaran, Tujuan Pembelajaran, Alur TP, dan Asesmen dibuat otomatis." },
  { icon: "📋", title: "Sesuai Kurikulum Merdeka", desc: "Output sesuai format Kurikulum Merdeka dengan 11 sections lengkap." },
  { icon: "📄", title: "Export PDF A4", desc: "Download modul sebagai PDF siap cetak dalam format resmi Kurikulum Merdeka." },
  { icon: "🎯", title: "Diferensiasi Otomatis", desc: "AI membuat 3 versi kegiatan untuk Visual, Auditori, dan Kinestetik." },
  { icon: "🔄", title: "Perbaharui Otomatis", desc: "Ketika BS KAP perbarui CP, modul ditandai perlu review dan bisa di-migrate." },
  { icon: "💳", title: "Berbayar Mulai Rp 49rb", desc: "Plan Free 2 modul/bulan. Plan Go Rp 49.000/bulan — 10 modul + PDF tanpa watermark." },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LANDING_JSON_LD) }}
      />
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-gray-900">Modulajar</span>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/library" className="text-gray-500 hover:text-gray-900">Library</Link>
            <Link href="/help" className="text-gray-500 hover:text-gray-900">Bantuan</Link>
            <Link href="/login" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700">
              Mulai Gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          🚀 Buat modul ajar dalam 60 detik — gratis 2/bulan
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
          Modul Ajar Kurikulum Merdeka<br />
          <span className="text-indigo-600">dalam 60 Detik</span>
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Platform AI untuk guru Indonesia. Generate Capaian Pembelajaran, Tujuan Pembelajaran, Alur TP, Kegiatan, dan Asesmen — lengkap sesuai format BS KAP — dalam hitungan detik.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-indigo-600 text-white text-base font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Buat Modul Gratis
          </Link>
          <Link
            href="/help"
            className="px-8 py-3.5 border border-gray-200 text-gray-700 text-base font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Lihat Demo
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Tanpa kartu kredit · 2 modul gratis/bulan</p>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Bagaimana Modulajar Bekerja</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Semua yang Guru Butuhkan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-5 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="bg-indigo-950 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-900 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              🚧 Sedang dalam pengembangan
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Yang Akan Datang</h2>
            <p className="text-indigo-300 text-sm max-w-lg mx-auto">Fitur-fitur yang sedang kami kembangkan untuk membuat Modulajar semakin lengkap.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "📓", title: "Jurnal Mengajar", desc: "Catat kegiatan belajar harian otomatis dari modul." },
              { icon: "📊", title: "Input Nilai", desc: "Input dan rekap nilai formatif & sumatif per siswa." },
              { icon: "📦", title: "Bukti PMM ZIP", desc: "Ekspor paket bukti kinerja siap upload ke PMM." },
              { icon: "🏫", title: "Plan Sekolah", desc: "Dashboard kepala sekolah + invoice BOS resmi." },
            ].map((item) => (
              <div key={item.title} className="bg-indigo-900/50 border border-indigo-800 rounded-xl p-5">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-white text-sm mb-1">{item.title}</h3>
                <p className="text-indigo-300 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Paket Berlangganan</h2>
          <p className="text-gray-500 text-sm text-center mb-10">Mulai gratis — upgrade kapan saja</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Free", price: "Rp 0", period: "/bulan",
                color: "text-gray-600", border: "border-gray-200",
                desc: "Untuk coba-coba",
                items: ["2 modul Full AI/bulan", "Preview modul", "Scratch editor"],
                cta: "Mulai Gratis",
                ctaClass: "border border-gray-300 text-gray-700 hover:bg-gray-50",
                highlight: false,
              },
              {
                name: "Go", price: "Rp 49.000", period: "/bulan",
                color: "text-indigo-600", border: "border-indigo-300",
                desc: "Untuk guru aktif",
                items: ["10 modul Full AI/bulan", "Download PDF tanpa watermark", "Jurnal & absensi", "Input nilai per TP", "Top-up Rp 5.000"],
                cta: "Pilih Go",
                ctaClass: "bg-indigo-600 text-white hover:bg-indigo-700",
                highlight: true,
                badge: "Populer",
              },
              {
                name: "Plus", price: "Rp 99.000", period: "/bulan",
                color: "text-amber-600", border: "border-amber-200",
                desc: "Untuk guru profesional",
                items: ["20 modul Full AI/bulan", "Prota & Promes AI", "Bank Soal AI", "Deskripsi Nilai AI", "Paket Bukti PMM ZIP"],
                cta: "Pilih Plus",
                ctaClass: "bg-gray-900 text-white hover:bg-gray-800",
                highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-6 ${plan.highlight ? "bg-indigo-50 border-2 border-indigo-400 shadow-sm" : "bg-white border "+plan.border}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    {plan.badge}
                  </div>
                )}
                <div className={`font-bold text-lg mb-1 ${plan.color}`}>{plan.name}</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{plan.price}</div>
                <div className="text-xs text-gray-400 mb-4">{plan.period}</div>
                <p className="text-xs text-gray-500 mb-4">{plan.desc}</p>
                <ul className="space-y-2 mb-6">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors ${plan.ctaClass}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Pertanyaan Umum</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <div key={faq.q} className="border border-gray-200 rounded-xl px-5 py-4">
                <div className="font-semibold text-gray-900 text-sm mb-1">{faq.q}</div>
                <div className="text-sm text-gray-500">{faq.a}</div>
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">M</div>
                <span className="font-bold text-gray-900 text-sm">Modulajar</span>
              </div>
              <p className="text-xs text-gray-400">Platform AI untuk guru Indonesia. Buat modul ajar Kurikulum Merdeka dalam menit.</p>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-xs mb-3 uppercase tracking-wide">Produk</div>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li><Link href="/modules/new" className="hover:text-gray-900">Buat Modul</Link></li>
                <li><Link href="/library" className="hover:text-gray-900">Library</Link></li>
                <li><Link href="/pricing" className="hover:text-gray-900">Harga</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-xs mb-3 uppercase tracking-wide">Bantuan</div>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li><Link href="/help" className="hover:text-gray-900">Pusat Bantuan</Link></li>
                <li><Link href="/terms" className="hover:text-gray-900">Syarat Layanan</Link></li>
                <li><Link href="/privacy" className="hover:text-gray-900">Privasi</Link></li>
                <li><Link href="/cookies" className="hover:text-gray-900">Cookie</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-xs mb-3 uppercase tracking-wide">Perusahaan</div>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li><a href="mailto:hello@modulajar.app" className="hover:text-gray-900">hello@modulajar.app</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">© 2026 CV. Artesis Sinar Endah Perdana. Hak cipta dilindungi.</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <Link href="/terms" className="hover:text-gray-600">Syarat</Link>
              <Link href="/privacy" className="hover:text-gray-600">Privasi</Link>
              <Link href="/refund" className="hover:text-gray-600">Refund</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}