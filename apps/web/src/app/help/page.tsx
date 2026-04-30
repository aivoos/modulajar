"use client";
import { useState } from "react";
import Link from "next/link";

const ARTICLES = [
  {
    id: "cara-buat-modul",
    title: "Cara Buat Modul Ajar dalam 60 Detik",
    icon: "⚡",
    content: `
<h2>Buat Modul Ajar dengan AI dalam 60 Detik</h2>
<p>Modulajar menggunakan kecerdasan buatan untuk membuat modul ajar Kurikulum Merdeka secara otomatis. Berikut langkah-langkahnya:</p>

<h3>Langkah 1: Pilih Mata Pelajaran</h3>
<p>Login ke akun Modulajar → klik "Buat Modul Baru" → pilih "Generate dengan AI". Pilih mata pelajaran (Matematika, IPA, Bahasa Indonesia, dll), fase (A–F), dan kelas.</p>

<h3>Langkah 2: Masukkan Topik</h3>
<p>Isikan topik utama modul ajar. Semakin spesifik semakin baik. Contoh: "Aljabar — Persamaan Linear Satu Variabel" lebih baik dari sekadar "Aljabar".</p>

<h3>Langkah 3: Pilih Durasi dan Gaya Belajar</h3>
<p>Pilih alokasi waktu (2x35 menit, 3x40 menit, dll) dan gaya belajar dominan siswa (visual, auditori, kinestetik, atau campuran).</p>

<h3>Langkah 4: Generate!</h3>
<p>Klik "Generate Sekarang" dan tunggu 30–60 detik. AI akan membuat Capaian Pembelajaran, Tujuan Pembelajaran, Alur TP, Kegiatan Pembelajaran, dan Asesmen secara otomatis.</p>

<h3>Langkah 5: Review dan Edit</h3>
<p>Setelah modul jadi, Anda bisa edit bagian mana pun sebelum publish atau export PDF.</p>
    `.trim(),
  },
  {
    id: "cara-bayar",
    title: "Cara Berlangganan dan Bayar",
    icon: "💳",
    content: `
<h2>Panduan Berlangganan Modulajar</h2>

<h3>Paket Berlangganan</h3>
<p>Modulajar menyediakan 3 paket:</p>
<ul>
  <li><strong>Free</strong> — 3× generate AI (lifetime), tidak bisa download PDF</li>
  <li><strong>Pro</strong> — Unlimited AI generate — Rp 249.000/tahun (ekuivalen Rp 41.500/bulan)</li>
  <li><strong>Sekolah</strong> — Unlimited untuk semua guru (maks 30), Rp 1.499.000/tahun</li>
</ul>

<h3>Semua plan tahunan (annual-only)</h3>
<p>Spec v3: semua plan tahunan. Tidak ada pilihan bulanan. Pro juga tersedia Rp 149.000/6 bulan. Ini membuat keputusan lebih mudah — satu keputusan per tahun, bukan 12.</p>

<h3>Cara Upgrade</h3>
<ol>
  <li>Buka Pengaturan → Langganan</li>
  <li>Pilih paket yang diinginkan</li>
  <li>Selesaikan pembayaran via QRIS, GoPay, OVO, Dana, VA BCA/Mandiri/BNI/BRI</li>
  <li>Setelah berhasil, paket langsung aktif</li>
</ol>

<h3>Pembayaran Gagal?</h3>
<p>Jika pembayaran gagal atau expired, Anda mendapat <strong>grace period 14 hari</strong> sebelum akses ditangguhkan. Segera selesaikan pembayaran untuk menghindari gangguan.</p>

<h3>Invoice dan Faktur</h3>
<p>Invoice PDF otomatis dikirim ke email setelah pembayaran berhasil. Plan Sekolah mendukung invoice BOS resmi dengan NPWP dan PPN 11%.</p>

<h3>Referral</h3>
<p>Dapat 10% dari pembayaran pertama teman yang Anda ajak, plus 5% recurring selama 12 bulan. Pencairan mingguan, minimal Rp 50.000.</p>
    `.trim(),
  },
  {
    id: "download-pdf",
    title: "Cara Download Modul Ajar sebagai PDF",
    icon: "📄",
    content: `
<h2>Download Modul Ajar sebagai PDF</h2>

<h3>Siapkan Modul</h3>
<p>Pastikan modul sudah dibuat dan diedit sesuai kebutuhan. Modul yang bisa didownload harus berstatus Draft atau Published.</p>

<h3>Download PDF</h3>
<ol>
  <li>Buka modul yang ingin di-download</li>
  <li>Klik tombol "PDF" di sudut kanan atas halaman preview</li>
  <li>File akan ter-download otomatis dalam format A4</li>
</ol>

<h3>Format PDF</h3>
<p>PDF yang dihasilkan sesuai standar Kurikulum Merdeka:</p>
<ul>
  <li>Ukuran A4, font standar</li>
  <li>Header dengan logo dan info modul</li>
  <li>Identity box (mapel, fase, kelas, alokasi waktu)</li>
  <li>Sections: CP, TP, ATP, Kegiatan, Asesmen</li>
</ul>

<h3>Pengguna Free</h3>
<p>Pengguna plan Free mendapat PDF dengan watermark diagonal "MODULAJAR — UPGRADE". Upgrade ke Go atau Plus untuk PDF tanpa watermark.</p>

<h3>Tidak Bisa Download?</h3>
<p>Jika tombol PDF tidak muncul atau download gagal, coba refresh halaman. Jika masih bermasalah, hubungi hello@modulajar.app.</p>
    `.trim(),
  },
  {
    id: "kurikulum-merdeka",
    title: "Modul Ajar dan Kurikulum Merdeka",
    icon: "📚",
    content: `
<h2>Mengenal Kurikulum Merdeka dan Modul Ajar</h2>

<h3>Apa itu Kurikulum Merdeka?</h3>
<p>Kurikulum Merdeka adalah kurikulum yang diterapkan di sekolah-sekolah Indonesia dengan fokus pada pembelajaran yang fleksibel dan sesuai kebutuhan siswa. Kurikulum ini mengembangkan kompetensi dan karakter siswa secara holistik.</p>

<h3>Apa itu Modul Ajar?</h3>
<p>Modul ajar adalah perangkat ajar yang disusun oleh guru untuk memandu pembelajaran di kelas. Modul ajar Kurikulum Merdeka memuat:</p>
<ul>
  <li><strong>Capaian Pembelajaran (CP)</strong> — tujuan akhir pembelajaran per fase</li>
  <li><strong>Tujuan Pembelajaran (TP)</strong> — target spesifik yang terukur</li>
  <li><strong>Alur Tujuan Pembelajaran (ATP)</strong> — rencana per minggu</li>
  <li><strong>Kegiatan Pembelajaran</strong> — aktivitas belajar aktif</li>
  <li><strong>Asesmen</strong> — diagnostik, formatif, dan sumatif</li>
</ul>

<h3>Mengapa Modul Ajar Penting?</h3>
<p>Modul ajar membantu guru dalam:</p>
<ul>
  <li>Merencanakan pembelajaran yang terstruktur</li>
  <li>Memastikan semua CP tercapai</li>
  <li>Melacak pencapaian siswa</li>
  <li>Dokumentasi untuk penilaian dan akuntabilitas</li>
</ul>

<h3>Fase dalam Kurikulum Merdeka</h3>
<ul>
  <li><strong>Fase A</strong> — Kelas 1-3 SD</li>
  <li><strong>Fase B</strong> — Kelas 4-6 SD</li>
  <li><strong>Fase C</strong> — Kelas 7-9 SMP</li>
  <li><strong>Fase D</strong> — Kelas 10-11 SMA</li>
  <li><strong>Fase E-F</strong> — Kelas 11-12 SMA (penguatan)</li>
</ul>
    `.trim(),
  },
  {
    id: "faq",
    title: "Pertanyaan yang Sering Diajukan (FAQ)",
    icon: "❓",
    content: `
<h2>Pertanyaan Umum tentang Modulajar</h2>

<h3>Apakah AI menghasilkan modul yang 100% akurat?</h3>
<p>AI membantu mempercepat pembuatan modul, tetapi hasilnya tetap harus direview oleh guru sebelum digunakan. AI dapat membuat kesalahan atau menggeneralisasi. Selalu проверка against kurikulum resmi dan konteks kelas Anda.</p>

<h3>Berapa biaya menggunakan Modulajar?</h3>
<p>Plan Free: gratis 3× generate AI (lifetime). Plan Pro: Rp 249.000/tahun (atau Rp 149.000/6 bulan). Plan Sekolah: Rp 1.499.000/tahun untuk maks 30 guru.</p>

<h3>Apakah saya bisa edit modul hasil AI?</h3>
<p>Ya! Semua modul hasil AI bisa diedit kapan saja. Modul tersimpan di dashboard dan bisa diedit, dipublish, atau di-archive.</p>

<h3>Apakah data siswa aman?</h3>
<p>Ya. Data siswa (nama, NIS) dikelola oleh Anda sebagai pengendali data. Kami tidak menjual atau membagikan data siswa. Semua data dienkripsi dan disimpan sesuai UU PDP.</p>

<h3>Bagaimana cara cancel langganan?</h3>
<p>Buka Pengaturan → Langganan → Batalkan. Pembatalan berlaku untuk periode berikutnya — Anda tetap akses sampai periode berakhir.</p>

<h3>Apakah ada versi sekolah?</h3>
<p>Ya, plan Sekolah dirancang untuk sekolah dengan minimum 3 guru. Tersedia dashboard khusus kepala sekolah dan invoice BOS resmi dengan NPWP dan PPN 11%.</p>

<h3>Apakah bisa digunakan tanpa internet?</h3>
<p>Fitur dasar bisa offline menggunakan PWA Modulajar. Fitur AI generation memerlukan koneksi internet.</p>

<h3>Bagaimana cara hubungi support?</h3>
<p>Email: hello@modulajar.app. Kami merespons dalam 1x24 jam kerja.</p>
    `.trim(),
  },
];

function ArticleCard({ article, open, onToggle }: {
  article: typeof ARTICLES[number]; open: boolean; onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{article.icon}</span>
          <span className="font-semibold text-gray-900">{article.title}</span>
        </div>
        <span className={`text-gray-400 text-xl transition-transform ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div
          className="px-5 pb-5 text-sm text-gray-600 leading-relaxed prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      )}
    </div>
  );
}

export default function HelpPage() {
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Beranda</Link>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">M</div>
            <span className="font-bold text-gray-900">Modulajar</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pusat Bantuan</h1>
          <p className="text-gray-500 text-sm">Temukan jawaban untuk pertanyaan Anda tentang Modulajar.</p>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {[
            { label: "Buat Modul", id: "cara-buat-modul" },
            { label: "Berbayar", id: "cara-bayar" },
            { label: "Download PDF", id: "download-pdf" },
            { label: "Kurikulum", id: "kurikulum-merdeka" },
            { label: "FAQ", id: "faq" },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => setOpenArticle(openArticle === link.id ? null : link.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                openArticle === link.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Articles */}
        <div className="space-y-3">
          {ARTICLES.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              open={openArticle === article.id}
              onToggle={() => setOpenArticle(openArticle === article.id ? null : article.id)}
            />
          ))}
        </div>

        {/* Contact */}
        <div className="bg-indigo-50 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-600 mb-3">Tidak menemukan jawaban yang Anda cari?</p>
          <a
            href="mailto:hello@modulajar.app"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700"
          >
            Hubungi Kami
          </a>
        </div>
      </main>
    </div>
  );
}