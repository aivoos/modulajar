"use client";
import { useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E2E8F0]">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0D1117]/85 backdrop-blur-xl border-b border-[#1A2030]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#4f46e5] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM13 12l3 3M16 12l-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-[15px] text-[#F1F5F9] tracking-tight">Modulajar</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#fitur" className="text-sm text-[#64748B] hover:text-[#E2E8F0] transition-colors font-medium">Fitur</Link>
            <Link href="/pricing" className="text-sm text-[#64748B] hover:text-[#E2E8F0] transition-colors font-medium">Harga</Link>
            <Link href="/blog/cara-buat-modul-ajar" className="text-sm text-[#64748B] hover:text-[#E2E8F0] transition-colors font-medium">Blog</Link>
            <Link href="/login" className="text-sm text-[#64748B] hover:text-[#E2E8F0] transition-colors font-medium">Masuk</Link>
            <Link href="/register" className="px-5 py-2 bg-[#F1F5F9] text-[#0D1117] text-sm font-semibold rounded-xl hover:bg-white transition-colors shadow-lg shadow-black/10">
              Mulai Gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24">
        {/* Gradient blobs */}
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)" }}/>
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)" }}/>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border border-[#10B981]/30 bg-[#10B981]/5">
            <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full shadow-sm shadow-[#10B981]/50"/>
            <span className="text-xs font-semibold text-[#10B981]">Gratis 2 modul/bulan — tanpa kartu kredit</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#F1F5F9] leading-[1.08] mb-6">
            Modul Ajar Kurikulum Merdeka
            <br/>
            <span style={{ color: "#6B7280" }}>dalam 60 Detik</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-[#64748B] leading-relaxed max-w-xl mx-auto mb-10">
            AI membuat Capaian Pembelajaran, Tujuan Pembelajaran, Alur TP, Kegiatan,
            dan Asesmen — otomatis sesuai format BS KAP.
          </p>

          {/* CTAs */}
          <div className="flex gap-3 justify-center flex-wrap mb-10">
            <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#F1F5F9] text-[#0D1117] text-[15px] font-semibold rounded-xl hover:bg-white transition-all shadow-xl shadow-black/20">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
              Buat Modul Gratis
            </Link>
            <Link href="/#cara-kerja" className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#161B27] text-[#94A3B8] text-[15px] font-semibold rounded-xl hover:bg-[#1A2030] transition-all border border-[#21293A]">
              Lihat Demo
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-5 flex-wrap">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#f59e0b"><path d="M7 1l1.8 3.6 3.9.6-2.8 2.7.7 3.9L7 9.8 4.4 11.8l.7-3.9L1.3 5.2l3.9-.6z"/></svg>
              ))}
              <span className="text-sm font-semibold text-[#94A3B8]">4.8/5</span>
              <span className="text-sm text-[#475569]">rating guru</span>
            </div>
            <span className="text-[#21293A]">·</span>
            <span className="text-sm text-[#64748B]">342+ guru aktif</span>
            <span className="text-[#21293A]">·</span>
            <span className="text-sm text-[#64748B]">Sesuai BS KAP</span>
          </div>
        </div>
      </section>

      {/* ── Mockup ─────────────────────────────────────────── */}
      <section className="pb-24 -mt-4">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-2xl border border-[#1A2030] overflow-hidden shadow-2xl shadow-black/40 bg-[#161B27]">
            {/* Chrome bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#0D1117] border-b border-[#1A2030]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"/>
              <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"/>
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]"/>
              <div className="flex-1 mx-4">
                <div className="bg-[#161B27] rounded-md px-3 py-1 text-[10px] text-[#334155]">modulajar.app/modules/new</div>
              </div>
            </div>
            {/* App skeleton */}
            <div className="p-8 bg-[#0D1117]">
              <div className="bg-[#161B27] rounded-xl border border-[#1A2030] p-6">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="w-32 h-3.5 bg-[#1A2030] rounded-lg mb-2"/>
                    <div className="w-48 h-2.5 bg-[#161B27] rounded"/>
                  </div>
                  <div className="w-24 h-8 bg-[#4F46E5] rounded-lg"/>
                </div>
                <div className="space-y-2 mb-5">
                  <div className="w-full h-2 bg-[#1A2030] rounded"/>
                  <div className="w-full h-2 bg-[#1A2030] rounded"/>
                  <div className="w-3/4 h-2 bg-[#1A2030] rounded"/>
                </div>
                <div className="w-full h-9 bg-[#111827] rounded-lg border border-[#1A2030]"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cara Kerja ─────────────────────────────────────── */}
      <section id="cara-kerja" className="py-20 border-t border-[#161B27]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#334155] uppercase tracking-widest mb-3">Cara Kerja</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#F1F5F9] tracking-tight">
              Tiga langkah mudah
            </h2>
            <p className="text-[#64748B] mt-3">untuk membuat modul ajar berkualitas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { num: "01", title: "Input Topik & Fase", desc: "Masukkan topik pelajaran, fase, dan alokasi waktu. AI menyesuaikan dengan kurikulum.", color: "#6366F1" },
              { num: "02", title: "AI Generate Konten", desc: "Dalam hitungan detik, AI membuat CP, TP, ATP, kegiatan pembelajaran, dan asesmen lengkap.", color: "#8B5CF6" },
              { num: "03", title: "Edit & Export PDF", desc: "Review hasilnya, lalu download modul ajar dalam format PDF siap pakai.", color: "#F59E0B" },
            ].map((step) => (
              <div key={step.num} className="bg-[#161B27] rounded-2xl p-7 border border-[#1A2030] hover:border-[#21293A] transition-colors">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold mb-5" style={{ background: step.color + "22", color: step.color }}>
                  {step.num}
                </div>
                <h3 className="text-[15px] font-bold text-[#E2E8F0] mb-2">{step.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fitur ───────────────────────────────────────────── */}
      <section id="fitur" className="py-20 bg-[#161B27]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#334155] uppercase tracking-widest mb-3">Fitur</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#F1F5F9] tracking-tight">
              Semua yang Anda butuhkan
            </h2>
            <p className="text-[#64748B] mt-3">untuk membuat modul ajar profesional</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "📋", title: "CP & TP Otomatis", desc: "Capaian dan Tujuan Pembelajaran di-generate sesuai fase dan topik." },
              { icon: "📊", title: "Alur TP Terstruktur", desc: "Alur Tujuan Pembelajaran dengan pendekatan yang logis dan sistematis." },
              { icon: "🎯", title: "Kegiatan Berbasis CP", desc: "Kegiatan pembelajaran yang selaras dengan Capaian Pembelajaran." },
              { icon: "📝", title: "Asesmen Lengkap", desc: "Instrumen asesmen diagnostik, formatif, dan sumatif." },
              { icon: "🎨", title: "Model Pembelajaran", desc: "Problem Based Learning, Project Based Learning, dan lainnya." },
              { icon: "⚙️", title: "Sesuai BS KAP", desc: "Format mengikuti Buku Sumber Capaian Pembelajaran resmi." },
            ].map((f) => (
              <div key={f.title} className="bg-[#0D1117] rounded-xl p-6 border border-[#1A2030] hover:border-[#21293A] transition-colors">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-[15px] font-bold text-[#E2E8F0] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coming Soon ────────────────────────────────────── */}
      <section className="py-16 bg-[#111827] border-y border-[#161B27]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-4 border border-[#21293A] rounded-full px-4 py-1.5">
            Coming Soon
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#F1F5F9] mb-3">Fitur yang akan datang</h2>
          <p className="text-[#64748B] max-w-md mx-auto text-sm leading-relaxed">
            Bank Soal AI, Template RPP, Modul Ajar Berbagi, dan Integrasi LMS sekolah
          </p>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <PricingSection/>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="py-20 border-t border-[#161B27]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#334155] uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold text-[#F1F5F9] tracking-tight">Pertanyaan Umum</h2>
          </div>

          <div className="space-y-2.5">
            {[
              { q: "Apakah Modulajar gratis?", a: "Ya, Anda bisa membuat 2 modul/bulan secara gratis. Untuk kebutuhan lebih banyak, upgrade ke paket Go." },
              { q: "Apakah sesuai BS KAP?", a: "Ya, semua modul ajar di-generate mengikuti format Buku Sumber Capaian Pembelajaran (BS KAP) resmi dari Kemendikbud." },
              { q: "Berapa lama membuat modul?", a: "Rata-rata 60 detik untuk modul lengkap (CP, TP, ATP, Kegiatan, Asesmen)." },
              { q: "Bisa edit hasilnya?", a: "Tentu saja. Hasil AI bisa diedit langsung sebelum didownload sebagai PDF." },
              { q: "Apakah bisa cancel kapan saja?", a: "Ya. Pembatalan berlaku untuk periode berikutnya — kamu tetap akses sampai periode berakhir." },
              { q: "Apakah bisa pakai invoice BOS?", a: "Plan Sekolah mendukung invoice BOS resmi dengan NPWP sekolah. Minimum 6 guru." },
            ].map((item, i) => (
              <details
                key={i}
                className="bg-[#161B27] rounded-xl border border-[#1A2030] overflow-hidden group"
                onToggle={(e) => setOpenFaq((e.target as HTMLElement).tagName === "DETAILS" && (e.target as HTMLDetailsElement).open ? i : null)}
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none text-[15px] font-semibold text-[#E2E8F0] group-open:border-b group-open:border-[#1A2030]">
                  {item.q}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#475569] flex-shrink-0 transition-transform group-open:rotate-180">
                    <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M4 6l4 4 4-4"/>
                  </svg>
                </summary>
                <div className="px-6 py-5 text-sm text-[#64748B] leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#1e1b4b] to-[#312e81]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            Siap membuat modul ajar pertama Anda?
          </h2>
          <p className="text-[#a5b4fc] mb-8 max-w-md mx-auto">
            Gratis 2 modul/bulan. Tanpa kartu kredit.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1e1b4b] text-[15px] font-bold rounded-xl hover:bg-[#f8fafc] transition-all">
            Daftar Gratis Sekarang
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="py-12 bg-[#0D1117] border-t border-[#161B27]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#4f46e5] to-[#7C3AED] rounded-lg flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 18 18" fill="none"><path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM13 12l3 3M16 12l-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span className="font-bold text-[#F1F5F9] text-sm">Modulajar</span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                Platform AI untuk guru Indonesia. Buat modul ajar Kurikulum Merdeka dalam hitungan detik.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#334155] uppercase tracking-widest mb-4">Produk</h4>
              <ul className="space-y-2.5">
                {[["Fitur", "/#fitur"], ["Harga", "/pricing"], ["Blog", "/blog/cara-buat-modul-ajar"]].map(([label, href]) => (
                  <li key={label}><Link href={href} className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#334155] uppercase tracking-widest mb-4">Bantuan</h4>
              <ul className="space-y-2.5">
                {[["Bantuan", "/help"], ["Masuk", "/login"], ["Daftar", "/register"]].map(([label, href]) => (
                  <li key={label}><Link href={href} className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#334155] uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[["Privasi", "/privacy"], ["Syarat", "/terms"], ["Cookie", "/cookies"], ["Refund", "/refund"]].map(([label, href]) => (
                  <li key={label}><Link href={href} className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#161B27] flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#334155]">© {new Date().getFullYear()} Modulajar. CV. Artesis Sinar Endah Perdana.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Pricing Section (sub-component) ───────────────────────────────────────────
const PLANS = [
  {
    key: "free",
    label: "Free",
    tagline: "Untuk coba-coba",
    color: "#6B7280",
    bg: "bg-[#161B27]",
    border: "border-[#21293A]",
    badge: null,
    monthly: 0,
    yearly: 0,
    aiQuota: "2/bulan",
    features: [
      "2 modul Full AI/bulan",
      "Preview modul di app",
      "Scratch editor + AI Assist",
      "Curated library + Fork",
    ],
    cta: "Mulai Gratis",
    ctaStyle: "bg-[#1A2030] text-[#94A3B8] hover:bg-[#21293A] border border-[#21293A]",
    href: "/register",
  },
  {
    key: "go",
    label: "Go",
    tagline: "Untuk guru aktif",
    color: "#4F46E5",
    bg: "bg-[#1E1B4B]",
    border: "border-[#4F46E5]/30",
    badge: "Populer",
    monthly: 49000,
    yearly: 490000,
    aiQuota: "10/bulan",
    features: [
      "10 modul Full AI/bulan",
      "Download PDF tanpa watermark",
      "Jurnal & absensi harian",
      "Input nilai per TP",
      "Top-up Rp 10.000 = +3 modul",
    ],
    cta: "Pilih Go",
    ctaStyle: "bg-[#4F46E5] text-white hover:bg-[#4338CA]",
    href: "/register?plan=go",
  },
  {
    key: "plus",
    label: "Plus",
    tagline: "Untuk guru profesional",
    color: "#F59E0B",
    bg: "bg-[#161B27]",
    border: "border-[#F59E0B]/30",
    badge: null,
    monthly: 99000,
    yearly: 990000,
    aiQuota: "20/bulan",
    features: [
      "20 modul Full AI/bulan",
      "Deskripsi Nilai AI (unlimited)",
      "Prota & Promes AI",
      "Bank Soal AI",
      "Paket Bukti PMM ZIP",
    ],
    cta: "Pilih Plus",
    ctaStyle: "bg-[#F59E0B] text-[#0D1117] hover:bg-[#D97706]",
    href: "/register?plan=plus",
  },
  {
    key: "sekolah",
    label: "Sekolah",
    tagline: "Min 6 guru",
    color: "#10B981",
    bg: "bg-[#161B27]",
    border: "border-[#10B981]/30",
    badge: null,
    monthly: 79000,
    yearly: 948000,
    aiQuota: "25/guru/bulan",
    features: [
      "25 modul/guru/bulan",
      "Dashboard kepala sekolah",
      "Invoice BOS resmi (NPWP)",
      "Upload master jadwal",
      "Rekap PKG semua guru",
    ],
    cta: "Hubungi Kami",
    ctaStyle: "bg-[#0D1117] text-[#10B981] hover:bg-[#0A2918] border border-[#10B981]/30",
    href: "mailto:hello@modulajar.app",
  },
];

function formatIDR(n: number) {
  if (n === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function PlanCard({ plan, cycle }: { plan: typeof PLANS[number]; cycle: "monthly" | "yearly" }) {
  const price = cycle === "yearly" ? plan.yearly : plan.monthly;
  const monthlyEquiv = cycle === "yearly" && plan.yearly > 0 ? Math.round(plan.yearly / 12) : plan.monthly;
  const isYearly = cycle === "yearly";
  const isHighlight = plan.key === "go";
  const annualSaving = plan.yearly > 0 ? (plan.monthly * 12 - plan.yearly) : 0;

  return (
    <div className={`relative rounded-2xl p-6 flex flex-col border ${plan.border} ${isHighlight ? plan.bg : "bg-[#161B27]"}`}>
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4F46E5] text-white text-[11px] px-4 py-1 rounded-full font-bold tracking-wide">
          {plan.badge}
        </div>
      )}

      <div className="mb-5">
        <div className="text-[16px] font-bold mb-0.5" style={{ color: plan.color }}>{plan.label}</div>
        <div className="text-xs text-[#475569] mb-3">{plan.tagline}</div>

        <div className="mb-1">
          <div className="text-[32px] font-extrabold text-[#F1F5F9] leading-none">
            {plan.key === "free" ? "Gratis" : (
              isYearly && plan.yearly > 0
                ? formatIDR(monthlyEquiv)
                : formatIDR(price)
            )}
          </div>
          <div className="text-xs text-[#475569] mt-1">
            {plan.key === "free" ? "/bulan" : "/bulan"}
            {isYearly && annualSaving > 0 && (
              <span className="text-[#10B981] ml-1.5 font-medium">· Hemat {formatIDR(annualSaving)}</span>
            )}
          </div>
          {plan.key !== "free" && isYearly && plan.yearly > 0 && (
            <div className="text-[11px] text-[#475569] mt-1">atau {formatIDR(plan.yearly)}/tahun</div>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg mt-3" style={{ background: plan.color + "18", color: plan.color }}>
          Full AI {plan.aiQuota}
        </div>
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-[#94A3B8]">
            <span className="text-[#10B981] mt-0.5 flex-shrink-0 font-bold">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <a
        href={plan.href}
        className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all ${plan.ctaStyle}`}
      >
        {plan.cta}
      </a>
    </div>
  );
}

function PricingSection() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <section id="harga" className="py-20 border-t border-[#161B27]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-[#334155] uppercase tracking-widest mb-3">Harga</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#F1F5F9] tracking-tight">
            Mulai gratis, upgrade kapan saja
          </h2>
          <p className="text-[#64748B] mt-3">Harga transparan — tanpa biaya tersembunyi</p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCycle("monthly")}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                cycle === "monthly"
                  ? "bg-[#1E1B4B] text-[#818CF8] border border-[#4F46E5]/40"
                  : "bg-[#161B27] text-[#475569] border border-[#21293A] hover:border-[#334155]"
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all relative ${
                cycle === "yearly"
                  ? "bg-[#1E1B4B] text-[#818CF8] border border-[#4F46E5]/40"
                  : "bg-[#161B27] text-[#475569] border border-[#21293A] hover:border-[#334155]"
              }`}
            >
              Tahunan
              <span className="ml-1.5 text-[10px] bg-[#10B981]/15 text-[#10B981] px-1.5 py-0.5 rounded-full font-semibold">Hemat 17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <PlanCard key={plan.key} plan={plan} cycle={cycle}/>
          ))}
        </div>

        <p className="text-center text-xs text-[#334155] mt-8">
          Semua harga sudah termasuk PPN 11%.{" "}
          <a href="mailto:hello@modulajar.app" className="text-[#6366F1] hover:underline">Pertanyaan? Hubungi kami</a>
        </p>
      </div>
    </section>
  );
}