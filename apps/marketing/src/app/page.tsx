import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-200">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM13 12l3 3M16 12l-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Modulajar</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#fitur" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Fitur</Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Harga</Link>
            <Link href="/blog/cara-buat-modul-ajar" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Blog</Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost text-sm hidden sm:inline-flex">Masuk</Link>
            <Link href="/register" className="btn btn-primary text-sm shadow-md">Mulai Gratis</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero-gradient relative">
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-[650px] h-[650px] opacity-25 pointer-events-none hidden md:block">
          <svg viewBox="0 0 650 650" fill="none" className="w-full h-full">
            <circle cx="500" cy="120" r="320" fill="url(#hg1)"/>
            <defs><radialGradient id="hg1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.35"/><stop offset="100%" stopColor="#818cf8" stopOpacity="0"/></radialGradient></defs>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] opacity-20 pointer-events-none hidden md:block">
          <svg viewBox="0 0 450 450" fill="none" className="w-full h-full">
            <circle cx="80" cy="320" r="260" fill="url(#hg2)"/>
            <defs><radialGradient id="hg2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#c084fc" stopOpacity="0.3"/><stop offset="100%" stopColor="#c084fc" stopOpacity="0"/></radialGradient></defs>
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-indigo-100">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Gratis 2 modul/bulan — tanpa kartu kredit
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
            Modul Ajar Kurikulum Merdeka
            <span className="block text-indigo-600 mt-2">dalam 60 Detik</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
            AI membuat Capaian Pembelajaran, Tujuan Pembelajaran, Alur TP, Kegiatan,
            dan Asesmen — otomatis sesuai format BS KAP.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/register" className="btn btn-primary text-base px-8 py-3.5 shadow-lg shadow-indigo-200">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
              Buat Modul Gratis
            </Link>
            <Link href="/#cara-kerja" className="btn btn-outline text-base px-8 py-3.5">
              Lihat Cara Kerjanya
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="#f59e0b"><path d="M7 1l1.8 3.6 3.9.6-2.8 2.7.7 3.9L7 9.8 4.4 11.8l.7-3.9L1.3 5.2l3.9-.6z"/></svg>
              <span className="font-medium text-gray-700">4.8</span>
              <span>rating guru</span>
            </div>
            <span className="text-gray-200 hidden sm:block">·</span>
            <span>342+ guru aktif</span>
            <span className="text-gray-200 hidden sm:block">·</span>
            <span>Sesuai BS KAP</span>
          </div>

          {/* Mockup */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-500/80"/>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"/>
                <div className="w-3 h-3 rounded-full bg-green-500/80"/>
                <span className="ml-3 text-xs text-gray-400 font-mono">Modulajar AI</span>
              </div>
              <div className="p-6 text-left">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">M</div>
                  <div>
                    <div className="text-white text-sm font-semibold">Modulajar AI Generator</div>
                    <div className="text-gray-400 text-xs">Mulai generate...</div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { icon: "check", text: "Capaian Pembelajaran generated", color: "text-green-400" },
                    { icon: "check", text: "Tujuan Pembelajaran (6 TP) created", color: "text-green-400" },
                    { icon: "check", text: "Alur TP & Asesmen Sumatif done", color: "text-green-400" },
                    { icon: "check", text: "3 versi diferensiasi (VAK) ready", color: "text-indigo-400" },
                    { icon: "spark", text: "Modul siap di-download", color: "text-amber-400" },
                  ].map((line, i) => (
                    <div key={i} className={`flex items-center gap-3 text-xs font-mono ${line.color}`}>
                      <span className="w-5 h-5 flex items-center justify-center bg-white/10 rounded-md flex-shrink-0">
                        {line.icon === "spark" ? "★" : "✓"}
                      </span>
                      <span>{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cara Kerja ──────────────────────────────────────── */}
      <section id="cara-kerja" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge badge-primary mb-4">3 Langkah</div>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">Bagaimana Modulajar Bekerja</h2>
            <p className="text-gray-500 text-lg max-w-md mx-auto">Simpel. Masuk, pilih mapel, generate — selesai.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Pilih Mapel & Fase",
                desc: "Matematika, IPA, Bahasa Indonesia — pilih fase A sampai F sesuai kelas yang kamu ajar.",
                icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="3" y="6" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M3 11h22M9 6v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
              },
              {
                step: "02",
                title: "Generate dengan AI",
                desc: "CP, Tujuan Pembelajaran, ATP, dan Asesmen dibuat otomatis dalam 60 detik.",
                icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="5" stroke="currentColor" strokeWidth="2"/><path d="M14 5v3M14 20v3M5 14h3M20 14h3M7.93 7.93l2.12 2.12M17.95 17.95l2.12 2.12M7.93 20.07l2.12-2.12M17.95 10.05l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
              },
              {
                step: "03",
                title: "Edit & Export PDF",
                desc: "Review output, edit yang perlu, lalu export PDF siap cetak atau publish ke murid.",
                icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M7 3h11l5 5v17a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="2"/><path d="M17 3v5h5M11 14h6M11 18h6M11 10h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
              },
            ].map((s) => (
              <div key={s.step} className="card p-8 relative overflow-hidden">
                <div className="text-7xl font-bold text-gray-100 absolute -top-2 -right-2 select-none">{s.step}</div>
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                  {s.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 relative">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed relative">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fitur ───────────────────────────────────────────── */}
      <section id="fitur" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge badge-primary mb-4">Fitur</div>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">Semua yang Guru Butuhkan</h2>
            <p className="text-gray-500 text-lg max-w-md mx-auto">Dari generate sampai export — dalam satu platform.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "Generate dalam 60 Detik", desc: "CP, Tujuan Pembelajaran, ATP, dan Asesmen dibuat otomatis.", color: "bg-amber-50 text-amber-600" },
              { icon: "📋", title: "Sesuai Kurikulum Merdeka", desc: "Output sesuai format BS KAP dengan 11 sections lengkap.", color: "bg-green-50 text-green-600" },
              { icon: "📄", title: "Export PDF A4", desc: "Download modul sebagai PDF siap cetak dalam format resmi.", color: "bg-blue-50 text-blue-600" },
              { icon: "🎯", title: "Diferensiasi Otomatis", desc: "AI membuat 3 versi kegiatan untuk Visual, Auditori, dan Kinestetik.", color: "bg-purple-50 text-purple-600" },
              { icon: "🔄", title: "Perbaharui Otomatis", desc: "Ketika BS KAP perbarui CP, modul ditandai perlu review dan bisa di-migrate.", color: "bg-cyan-50 text-cyan-600" },
              { icon: "💳", title: "Berbayar Mulai Rp 49rb", desc: "Plan Free 2 modul/bulan. Plan Go Rp 49.000 — 10 modul + PDF tanpa watermark.", color: "bg-emerald-50 text-emerald-600" },
            ].map((f) => (
              <div key={f.title} className="card card-hover p-6">
                <div className={`w-12 h-12 ${f.color.split(" ")[0]} rounded-xl flex items-center justify-center mb-4 text-2xl`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coming Soon ─────────────────────────────────────── */}
      <section className="py-24 bg-[#1e1b4b]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-indigo-900 text-indigo-300 text-sm font-medium px-4 py-1.5 rounded-full mb-5 border border-indigo-700">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
              Sedang dalam pengembangan
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Yang Akan Datang</h2>
            <p className="text-indigo-300 text-lg max-w-md mx-auto">Fitur yang sedang kami kembangkan.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "📓", title: "Jurnal Mengajar", desc: "Catat kegiatan belajar harian otomatis dari modul." },
              { icon: "📊", title: "Input Nilai", desc: "Input dan rekap nilai formatif & sumatif per siswa." },
              { icon: "📦", title: "Bukti PMM ZIP", desc: "Ekspor paket bukti kinerja siap upload ke PMM." },
              { icon: "🏫", title: "Plan Sekolah", desc: "Dashboard kepala sekolah + invoice BOS resmi." },
            ].map((item) => (
              <div key={item.title} className="bg-indigo-900/50 border border-indigo-800/60 rounded-2xl p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-indigo-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="badge badge-primary mb-4">Harga</div>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">Paket Berlangganan</h2>
            <p className="text-gray-500 text-lg">Mulai gratis — upgrade kapan saja</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Free", price: "Rp 0", period: "/bulan",
                color: "text-gray-600", border: "border-gray-200",
                desc: "Untuk coba-coba",
                items: ["2 modul Full AI/bulan","Preview modul","Scratch editor","Community support"],
                cta: "Daftar Gratis", ctaClass: "btn btn-outline w-full", highlight: false,
              },
              {
                name: "Go", price: "Rp 49.000", period: "/bulan",
                color: "text-indigo-600", border: "border-indigo-300",
                desc: "Untuk guru aktif",
                items: ["10 modul Full AI/bulan","Download PDF tanpa watermark","Jurnal & absensi","Input nilai per TP","Top-up Rp 5.000/modul"],
                cta: "Pilih Go", ctaClass: "btn btn-primary w-full shadow-md", highlight: true, badge: "Populer",
              },
              {
                name: "Plus", price: "Rp 99.000", period: "/bulan",
                color: "text-amber-600", border: "border-amber-200",
                desc: "Untuk guru profesional",
                items: ["20 modul Full AI/bulan","Prota & Promes AI","Bank Soal AI","Deskripsi Nilai AI","Paket Bukti PMM ZIP"],
                cta: "Pilih Plus", ctaClass: "btn btn-outline w-full", highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name} className={`card p-8 relative ${plan.highlight ? "ring-2 ring-indigo-500 ring-offset-4" : ""}`}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-sm">
                    {plan.badge}
                  </div>
                )}
                <div className={`font-bold text-lg mb-1 ${plan.color}`}>{plan.name}</div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{plan.price}</div>
                <div className="text-sm text-gray-400 mb-5">{plan.period}</div>
                <p className="text-sm text-gray-500 mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0">
                        <circle cx="8" cy="8" r="7" fill="#ecfdf5" stroke="#059669" strokeWidth="1.5"/>
                        <path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={plan.ctaClass}>{plan.cta}</Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">
            <Link href="/pricing" className="text-indigo-600 hover:underline">Lihat perbandingan lengkap fitur →</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="badge badge-primary mb-4">FAQ</div>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Pertanyaan Umum</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Apakah gratis?", a: "Plan Free memberikan 2 modul/bulan gratis tanpa perlu bayar. Tidak butuh kartu kredit." },
              { q: "Berapa biaya langganan?", a: "Plan Go mulai Rp 49.000/bulan untuk 10 modul Full AI. Plan Plus Rp 99.000/bulan." },
              { q: "Apakah modul hasil AI akurat?", a: "AI menghasilkan draft yang harus direview guru. Hasil tidak dijamin 100% akurat." },
              { q: "Bisa offline?", a: "Fitur dasar bisa offline lewat PWA. Generate AI butuh koneksi internet." },
              { q: "Bagaimana dengan data saya?", a: "Semua data disimpan di Supabase (AWS Singapore). Tidak dijual. Baca Kebijakan Privasi." },
            ].map((faq, i) => (
              <details key={i} className="card group p-0 cursor-pointer">
                <summary className="flex items-center justify-between gap-4 p-6 list-none select-none">
                  <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{faq.q}</span>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform duration-200">
                    <path d="M4.5 6.75l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-gray-500 leading-relaxed border-t border-gray-100 pt-4">{faq.a}</div>
              </details>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-8">
            Ada pertanyaan lain?{" "}
            <a href="mailto:hello@modulajar.app" className="text-indigo-600 hover:underline font-medium">Hubungi kami</a>
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM13 12l3 3M16 12l-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span className="font-bold text-gray-900">Modulajar</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">Platform AI untuk guru Indonesia.</p>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm mb-4">Produk</div>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link href="/#fitur" className="hover:text-gray-900 transition-colors">Fitur</Link></li>
                <li><Link href="/pricing" className="hover:text-gray-900 transition-colors">Harga</Link></li>
                <li><Link href="/register" className="hover:text-gray-900 transition-colors">Daftar Gratis</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm mb-4">Bantuan</div>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link href="/help" className="hover:text-gray-900 transition-colors">Pusat Bantuan</Link></li>
                <li><Link href="/blog/cara-buat-modul-ajar" className="hover:text-gray-900 transition-colors">Blog</Link></li>
                <li><a href="mailto:hello@modulajar.app" className="hover:text-gray-900 transition-colors">hello@modulajar.app</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm mb-4">Legal</div>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link href="/terms" className="hover:text-gray-900 transition-colors">Syarat Layanan</Link></li>
                <li><Link href="/privacy" className="hover:text-gray-900 transition-colors">Kebijakan Privasi</Link></li>
                <li><Link href="/cookies" className="hover:text-gray-900 transition-colors">Cookie</Link></li>
                <li><Link href="/refund" className="hover:text-gray-900 transition-colors">Refund</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">© 2026 CV. Artesis Sinar Endah Perdana</p>
            <p className="text-xs text-gray-400">Built with ❤️ for Indonesian teachers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}