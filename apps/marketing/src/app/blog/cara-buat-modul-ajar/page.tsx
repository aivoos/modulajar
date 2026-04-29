import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cara Buat Modul Ajar Kurikulum Merdeka dalam 60 Detik",
  description: "Tutorial lengkap membuat modul ajar Kurikulum Merdeka menggunakan AI Modulajar. CP, TP, ATP, Kegiatan, dan Asesmen otomatis dalam hitungan menit.",
  openGraph: {
    title: "Cara Buat Modul Ajar Kurikulum Merdeka dalam 60 Detik",
    description: "Tutorial lengkap membuat modul ajar Kurikulum Merdeka menggunakan AI Modulajar.",
    type: "article",
    publishedTime: "2026-04-28",
    authors: ["Modulajar"],
    tags: ["modul ajar", "kurikulum merdeka", "AI", "pendidikan"],
  },
};

const ARTICLE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Cara Buat Modul Ajar Kurikulum Merdeka dalam 60 Detik",
  description: "Tutorial lengkap membuat modul ajar Kurikulum Merdeka menggunakan AI Modulajar.",
  datePublished: "2026-04-28",
  dateModified: "2026-04-28",
  author: { "@type": "Organization", name: "Modulajar" },
  publisher: {
    "@type": "Organization",
    name: "Modulajar",
    logo: { "@type": "ImageObject", url: "https://modulajar.app/favicon.svg" },
  },
  mainEntityOfPage: "https://modulajar.app/blog/cara-buat-modul-ajar",
};

export default function BlogArticle() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }}
      />
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-gray-900">Modulajar</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/pricing" className="text-gray-500 hover:text-gray-900">Harga</Link>
            <Link href="/help" className="text-gray-500 hover:text-gray-900">Bantuan</Link>
            <Link href="/register" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700">
              Buat Modul Gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-indigo-600">Beranda</Link>
          <span>/</span>
          <span>Blog</span>
          <span>/</span>
          <span className="text-gray-600">Cara Buat Modul Ajar</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full">Tutorial</span>
            <span className="text-xs text-gray-400">28 April 2026 · 8 menit baca</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-6">
            Cara Buat Modul Ajar Kurikulum Merdeka<br />
            <span className="text-indigo-600">dalam 60 Detik</span>
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            Langkah demi langkah membuat modul ajar lengkap sesuai format Kurikulum Merdeka menggunakan Modulajar — dari CP sampai Asesmen, semua otomatis.
          </p>
        </div>

        {/* TOC */}
        <div className="bg-gray-50 rounded-xl p-5 mb-10">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Daftar Isi</h2>
          <ol className="space-y-1.5 text-sm text-gray-600">
            {[
              "Apa Itu Modul Ajar Kurikulum Merdeka?",
              "Persiapan: Buka Modulajar & Login",
              "Langkah 1: Pilih Mata Pelajaran & Fase",
              "Langkah 2: Masukkan Topik Modul",
              "Langkah 3: Pilih Durasi & Gaya Belajar",
              "Langkah 4: Generate dengan AI",
              "Langkah 5: Review & Edit Modul",
              "Langkah 6: Download PDF",
              "Tips Agar Modul Hasil AI Lebih Akurat",
              "Kesimpulan",
            ].map((item, i) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-indigo-600 font-semibold w-5">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none leading-relaxed space-y-6">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Apa Itu Modul Ajar Kurikulum Merdeka?</h2>
            <p className="text-gray-600 leading-relaxed">
              Modul ajar adalah perangkat ajar yang disusun guru untuk memandu pembelajaran di kelas. Berbeda dengan RPP tradisional, modul ajar Kurikulum Merdeka dirancang agar pembelajaran lebih fleksibel dan sesuai kebutuhan siswa.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Modul ajar Kurikulum Merdeka terdiri dari <strong>11 komponen utama</strong>: Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), Alur Tujuan Pembelajaran (ATP), Pemahaman Bermakna, Pertanyaan Pemantik, Kegiatan Pembelajaran, Asesmen Diagnostik, Asesmen Formatif, Asesmen Sumatif, Pemantauan Belajar, dan Pengayaan.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Membuat 11 komponen ini secara manual biasanya memakan waktu <strong>2-4 jam per modul</strong>. Dengan Modulajar, semua komponen tersebut dibuat otomatis dalam 60 detik.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Persiapan: Buka Modulajar & Login</h2>
            <p className="text-gray-600 leading-relaxed">
              Buka <Link href="/" className="text-indigo-600 hover:underline">modulajar.app</Link> dan klik "Mulai Gratis". Masukkan nama, email, dan password. Setelah login, kamu langsung bisa membuat 2 modul/bulan tanpa perlu bayar.
            </p>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
              💡 <strong>Tips:</strong> Upgrade ke plan Go (Rp 49.000/bulan) untuk 10 modul AI + download PDF tanpa watermark.
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Langkah 1: Pilih Mata Pelajaran & Fase</h2>
            <p className="text-gray-600 leading-relaxed">
              Di halaman "Buat Modul Baru", pilih mata pelajaran dari dropdown. Tersedia: Matematika, IPA, Bahasa Indonesia, IPS, Bahasa Inggris, PJOK, Seni Budaya, Prakarya, PPKn, Bahasa Daerah, dan Pendidikan Agama.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Setelah itu, pilih <strong>Fase</strong> sesuai jenjang:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li><strong>Fase A</strong> — Kelas 1-3 SD</li>
              <li><strong>Fase B</strong> — Kelas 4-6 SD</li>
              <li><strong>Fase C</strong> — Kelas 7-9 SMP</li>
              <li><strong>Fase D</strong> — Kelas 10-11 SMA</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Pilih juga kelas (contoh: "Kelas 8") dan semester (Ganjil/Genap).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Langkah 2: Masukkan Topik Modul</h2>
            <p className="text-gray-600 leading-relaxed">
              Masukkan topik utama modul ajar di kolom yang tersedia. <strong>Semakin spesifik, semakin baik hasil AI.</strong>
            </p>
            <p className="text-gray-600 leading-relaxed">
              Contoh topik yang baik: "Aljabar — Persamaan Linear Satu Variabel", bukan sekadar "Aljabar".
            </p>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Contoh topik yang tepat:</p>
              <p className="text-gray-700 text-sm">→ "Himpunan — Operasi Irisan dan Gabungan"</p>
              <p className="text-gray-400 text-sm mt-1">→ ❌ "Himpunan" (terlalu umum)</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Langkah 3: Pilih Durasi & Gaya Belajar</h2>
            <p className="text-gray-600 leading-relaxed">
              Pilih alokasi waktu sesuai jam pelajaran di sekolahmu:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>2 × 35 menit (SD)</li>
              <li>3 × 40 menit (SMP)</li>
              <li>3 × 45 menit (SMA)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Pilih juga <strong>gaya belajar dominan siswa</strong>: Visual, Auditori, Kinestetik, atau Campuran. AI Modulajar akan membuat 3 versi kegiatan pembelajaran sesuai diferensiasi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Langkah 4: Generate dengan AI</h2>
            <p className="text-gray-600 leading-relaxed">
              Klik tombol <strong>"Generate Sekarang"</strong>. Tunggu 30-60 detik — AI Modulajar akan membuat:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Capaian Pembelajaran (CP)</li>
              <li>Tujuan Pembelajaran (TP) sesuai fase</li>
              <li>Alur Tujuan Pembelajaran (ATP)</li>
              <li>Kegiatan Pembelajaran 3 versi (Visual, Auditori, Kinestetik)</li>
              <li>Asesmen Diagnostik, Formatif, dan Sumatif</li>
            </ul>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 mt-4">
              ⏱️ Rata-rata waktu generate: 45 detik. Kamu bisa tinggal scroll media sosial lalu kembali.
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Langkah 5: Review & Edit Modul</h2>
            <p className="text-gray-600 leading-relaxed">
              Setelah modul jadi, <strong>review setiap bagian</strong>. AI Modulajar membuat draft yang perlu diverifikasi guru. Cek:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>CP — pastikan sesuai Elemen CPBS/CPMPT</li>
              <li>TP — pastikan terukur dan sesuai CP</li>
              <li>Kegiatan — sesuaikan dengan kondisi kelas</li>
              <li>Asesmen — pastikan soal valid dan relevan</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Klik bagian mana pun untuk edit. Gunakan Scratch Editor untuk perubahan besar, atau klik langsung di bidang teks untuk koreksi kecil.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Langkah 6: Download PDF</h2>
            <p className="text-gray-600 leading-relaxed">
              Jika puas dengan hasilnya, klik <strong>"Publish"</strong> untuk mempublish modul. Atau langsung klik tombol <strong>"PDF"</strong> di sudut kanan atas untuk download.
            </p>
            <p className="text-gray-600 leading-relaxed">
              PDF yang dihasilkan sudah dalam format A4 sesuai standar Kurikulum Merdeka — bisa langsung dicetak atau diupload ke Platform Merdeka Mengajar (PMM).
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mt-4">
              <p className="text-xs text-gray-500 mb-2">Plan Free:</p>
              <p className="text-sm text-gray-700">PDF dengan watermark diagonal "MODULAJAR — UPGRADE". Upgrade ke Go/Plus untuk PDF tanpa watermark.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tips Agar Modul Hasil AI Lebih Akurat</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong>Gunakan topik spesifik</strong> — "Sistem Pernapasan Manusia" lebih baik dari "Biologi"</li>
              <li><strong>Review hasil sebelum publish</strong> — AI bisa salah generik</li>
              <li><strong>Sesuaikan dengan kondisi kelas</strong> — jumlah siswa, alat, waktu</li>
              <li><strong>Cek CP terbaru di PMM</strong> — BS KAP kadang update CP</li>
              <li><strong>Gunakan fitur diferensiasi</strong> — pilih gaya belajar yang sesuai siswa</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Kesimpulan</h2>
            <p className="text-gray-600 leading-relaxed">
              Modulajar membantu guru Indonesia membuat modul ajar Kurikulum Merdeka <strong>10x lebih cepat</strong> — dari 2-4 jam jadi 60 detik. Hasil AI bukan pengganti kerja guru, tapi alat bantu yang mempercepat proses sehingga guru punya lebih banyak waktu untuk hal lain.
            </p>
            <div className="bg-indigo-600 rounded-xl p-6 mt-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">Mulai sekarang — gratis 2 modul/bulan</p>
                <p className="text-indigo-200 text-sm">Tidak perlu kartu kredit · Langsung bisa generate</p>
              </div>
              <Link
                href="/register"
                className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors flex-shrink-0"
              >
                Buat Modul Gratis →
              </Link>
            </div>
          </section>

        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-100">
          {["Modul Ajar", "Kurikulum Merdeka", "AI Pendidikan", "Tutorial"].map((tag) => (
            <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* Share */}
        <div className="mt-6 flex items-center gap-3">
          <span className="text-sm text-gray-500">Bagikan:</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Cara Buat Modul Ajar Kurikulum Merdeka dalam 60 Detik")}&url=${encodeURIComponent("https://modulajar.app/blog/cara-buat-modul-ajar")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200"
          >
            Twitter/X
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent("Cara Buat Modul Ajar Kurikulum Merdeka dalam 60 Detik - https://modulajar.app/blog/cara-buat-modul-ajar")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg hover:bg-green-200"
          >
            WhatsApp
          </a>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">M</div>
            <span className="font-bold text-gray-900 text-sm">Modulajar</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 CV. Artesis Sinar Endah Perdana</p>
        </div>
      </footer>
    </div>
    </>
  );
}