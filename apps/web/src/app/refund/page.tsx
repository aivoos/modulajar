export const metadata = {
  title: "Kebijakan Pengembalian Dana — Modulajar",
  description: "Kebijakan refund dan pembatalan langganan Modulajar",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
          <span className="font-bold text-gray-900">Modulajar</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kebijakan Pengembalian Dana (Refund)</h1>
        <p className="text-sm text-gray-500 mb-8">Terakhir diperbarui: 28 April 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Kebijakan Umum</h2>
            <p>Modulajar memahami bahwa situasi dapat berubah. Kami berusaha untuk memberikan fleksibilitas seminimal mungkin dalam kebijakan refund ini.</p>
            <p>Secara umum, pembayaran langganan TIDAK dapat dikembalikan setelah diproses (non-refundable), karena:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Layanan sudah tersedia sejak pembayaran diterima.</li>
              <li>AI credits sudah di-commit ke akun Anda.</li>
              <li>Biaya operasional sudah dikeluarkan (payment gateway, infrastruktur).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Pengecualian (Kasus Khusus)</h2>
            <p>Kami dapat mempertimbangkan refund dalam kasus berikut:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dua kali pembayaran:</strong> Jika Anda secara tidak sengaja melakukan pembayaran dua kali untuk periode yang sama, kami akan mengembalikan pembayaran kedua.</li>
              <li><strong>Gangguan layanan:</strong> Jika layanan tidak tersedia lebih dari 72 jam berturut-turut karena alasan kami (bukan pemeliharaan terjadwal), kami dapat memberikan kompensasi berupa perpanjangan langganan.</li>
              <li><strong>Kondisi extreme:</strong> Untuk situasi lain yang tidak biasa, silakan hubungi kami di hello@modulajar.app untuk dievaluasi secara individual.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Pembatalan Langganan</h2>
            <p>Anda dapat membatalkan langganan kapan saja melalui menu Pengaturan → Langganan → Batalkan.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pembatalan berlaku untuk periode berikutnya — Anda tetap memiliki akses sampai periode yang sudah dibayar berakhir.</li>
              <li>Setelah pembatalan, akun akan downgrade ke paket Free (2 modul/bulan) di akhir periode.</li>
              <li>Modul ajar, jurnal, dan nilai yang sudah Anda buat TIDAK akan dihapus.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Penghapusan Akun dan Export Data</h2>
            <p>Jika Anda menghapus akun:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kami akan mengekspor semua data Anda (modul ajar, jurnal, nilai) dalam format ZIP.</li>
              <li>File export dikirim ke email Anda dalam 14 hari kerja.</li>
              <li>Akun dan semua data dihapus permanen setelah 30 hari.</li>
              <li>Data tidak dapat dipulihkan setelah dihapus.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Downgrade Paket</h2>
            <p>Downgrade dari paket yang lebih tinggi ke paket yang lebih rendah dapat dilakukan kapan saja. Sisa AI quota tidak dapat ditransfer atau di-refund. Downgrade berlaku di periode berikutnya.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Cara Meminta Refund</h2>
            <p>Untuk mengajukan permintaan refund atau komplain, silakan hubungi kami:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email: hello@modulajar.app dengan subjek "Refund Request"</li>
              <li>Kami akan merespons dalam 3 hari kerja.</li>
              <li>Jika disetujui, refund akan diproses dalam 7-14 hari kerja ke rekening atau metode pembayaran asli.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. Kontak</h2>
            <p><strong>PT Modulajar Indonesia</strong><br />
            Email: hello@modulajar.app</p>
          </section>
        </div>
      </main>
    </div>
  );
}