export const metadata = {
  title: "Kebijakan Privasi — Modulajar",
  description: "Kebijakan privasi dan perlindungan data pengguna Modulajar",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
          <span className="font-bold text-gray-900">Modulajar</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kebijakan Privasi</h1>
        <p className="text-sm text-gray-500 mb-8">Terakhir diperbarui: 28 April 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Pendahuluan</h2>
            <p>PT Modulajar Indonesia ("Modulajar", "kami", "milik kami") berkomitmen untuk melindungi privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi pribadi Anda ketika Anda menggunakan layanan kami.</p>
            <p>Kebijakan ini dibuat sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP) Republik Indonesia No. 27 Tahun 2022.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Informasi yang Kami Kumpulkan</h2>
            <p><strong>Informasi akun:</strong> Nama, alamat email, nomor telepon, NIP (opsional), dan informasi sekolah.</p>
            <p><strong>Informasi konten:</strong> Modul ajar yang Anda buat, jurnal mengajar, data nilai siswa, dan metadata terkait.</p>
            <p><strong>Informasi penggunaan:</strong> Data tentang bagaimana Anda menggunakan platform, termasuk halaman yang dikunjungi, fitur yang digunakan, dan waktu akses.</p>
            <p><strong>Data siswa:</strong> Nama, NIS, dan gender siswa — data ini dikelola oleh Anda sebagai pengendali data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Bagaimana Kami Menggunakan Informasi</h2>
            <p>Kami menggunakan informasi yang dikumpulkan untuk:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Menyediakan dan meningkatkan layanan Modulajar</li>
              <li>Menghasilkan modul ajar menggunakan AI</li>
              <li>Mengirim notifikasi terkait langganan dan jadwal mengajar</li>
              <li>Memproses pembayaran dan penagihan</li>
              <li>Menganalisis usage untuk meningkatkan produk</li>
              <li>Mematuhi kewajiban hukum dan regulasi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Dasar Hukum Pemrosesan</h2>
            <p>Kami memproses data pribadi Anda berdasarkan dasar hukum yang diizinkan oleh UU PDP:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Persetujuan:</strong> Untuk pemrosesan yang memerlukan persetujuan Anda (misalnya, notifikasi push).</li>
              <li><strong>Perjanjian:</strong> Untuk menyediakan layanan yang Anda minta.</li>
              <li><strong>Kepatuhan hukum:</strong> Untuk memenuhi kewajiban regulasi (misalnya, penyimpanan data untuk audit).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Pembagian Data</h2>
            <p>Kami TIDAK menjual data pribadi Anda kepada pihak ketiga. Kami hanya membagikan data dalam situasi berikut:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Penyedia layanan:</strong> Kami menggunakan pihak ketiga (seperti Supabase, OpenAI, Xendit) yang memproses data atas nama kami dengan perjanjian kerahasiaan.</li>
              <li><strong>Kepatuhan hukum:</strong> Jika diwajibkan oleh hukum atau untuk melindungi hak kami.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Retensi Data</h2>
            <p>Kami menyimpan data pribadi Anda selama akun Anda aktif dan selama diperlukan untuk menyediakan layanan. Anda dapat meminta penghapusan data kapan saja melalui menu Pengaturan → Hapus Akun.</p>
            <p>Data siswa (nama, NIS) akan dihapus bersamaan dengan penghapusan teaching class yang terkait.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. Hak Anda (Sesuai UU PDP)</h2>
            <p>Sebagai subjek data, Anda memiliki hak untuk:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Akses:</strong> Meminta salinan data pribadi Anda.</li>
              <li><strong>Koreksi:</strong> Memperbaiki data yang tidak akurat.</li>
              <li><strong>Penghapusan:</strong> Meminta penghapusan data Anda ("hak untuk dilupakan").</li>
              <li><strong>Portabilitas:</strong> Menerima data Anda dalam format yang terstruktur.</li>
              <li><strong>Keberatan:</strong> Menolak pemrosesan tertentu.</li>
            </ul>
            <p>Untuk menggunakan hak-hak ini, hubungi kami di hello@modulajar.app. Kami akan merespons dalam 14 hari kerja.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">8. Keamanan Data</h2>
            <p>Kami menggunakan langkah-langkah teknis dan organisasi yang sesuai untuk melindungi data pribadi Anda, termasuk enkripsi, akses terbatas, dan audit keamanan berkala. Namun, tidak ada sistem yang 100% aman — kami tidak dapat menjamin keamanan absolut.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">9. Transfer Data Internasional</h2>
            <p>Beberapa data (seperti prompts ke AI) diproses oleh server di luar Indonesia (OpenAI, Anthropic). Kami memastikan bahwa transfer tersebut dilakukan dengan standar keamanan yang memadai dan sesuai dengan ketentuan UU PDP tentang transfer data lintas batas.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">10. Perubahan Kebijakan</h2>
            <p>Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu. Perubahan signifikan akan diumumkan melalui email atau notifikasi di platform. Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">11. Kontak</h2>
            <p><strong>PT Modulajar Indonesia</strong><br />
            Email: hello@modulajar.app</p>
          </section>
        </div>
      </main>
    </div>
  );
}