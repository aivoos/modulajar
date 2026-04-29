export const metadata = {
  title: "Kebijakan Cookie — Modulajar",
  description: "Kebijakan cookie dan analitik yang digunakan oleh Modulajar",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
          <span className="font-bold text-gray-900">Modulajar</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kebijakan Cookie</h1>
        <p className="text-sm text-gray-500 mb-8">Terakhir diperbarui: 28 April 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Apa Itu Cookie?</h2>
            <p>Cookie adalah file kecil yang disimpan di perangkat Anda (komputer, tablet, atau ponsel) saat Anda mengunjungi situs web. Cookie digunakan untuk mengingat preferensi Anda, menganalisis penggunaan situs, dan meningkatkan pengalaman browsing Anda.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Jenis Cookie yang Kami Gunakan</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">🍪 Cookie Wajib (Essential)</h3>
                <p className="text-gray-600 text-xs leading-relaxed">Cookie ini diperlukan agar Modulajar berfungsi dengan baik. Tanpa cookie ini, fitur login, autentikasi, dan keamanan tidak dapat beroperasi. Cookie ini tidak memerlukan persetujuan Anda karena sudah termasuk dalam paket dasar layanan.</p>
                <div className="mt-2 text-xs text-gray-500">Contoh: <code>sb-access-token</code>, <code>__stripe_mid</code></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">📊 Cookie Analitik (Analytics)</h3>
                <p className="text-gray-600 text-xs leading-relaxed">Cookie analitik digunakan untuk memahami bagaimana pengunjung menggunakan Modulajar — halaman mana yang sering dikunjungi, berapa lama waktu yang dihabiskan, dan fitur mana yang paling sering digunakan. Data ini membantu kami meningkatkan layanan.</p>
                <div className="mt-2 text-xs text-gray-500">Contoh: Posthog (<code>ph_phc</code>), PostHog EU instance</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">🎯 Cookie Preferensi</h3>
                <p className="text-gray-600 text-xs leading-relaxed">Cookie ini mengingat preferensi Anda seperti bahasa yang dipilih, tema tampilan, dan pengaturan lainnya agar Anda tidak perlu mengaturnya ulang setiap kali mengunjungi.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Siapa Saja yang Menggunakan Cookie?</h2>
            <div className="space-y-3">
              {[
                { name: "Modulajar (CV. Artesis Sinar Endah Perdana)", desc: "Cookie internal untuk autentikasi dan preferensi." },
                { name: "Supabase", desc: "Platform database dan autentikasi. Menyimpan cookie session untuk login. Lokasi server: AWS Singapore (ap-southeast-1)." },
                { name: "PostHog (EU)", desc: "Analitik produk. Cookie analitik hanya aktif setelah Anda memberikan persetujuan melalui banner cookie di halaman pertama kali kunjungan." },
                { name: "Stripe / Xendit", desc: "Payment gateway. Cookie keamanan yang diperlukan untuk proses pembayaran." },
                { name: "OpenAI / Anthropic", desc: "API AI. Ketika Anda menggunakan fitur generate modul, prompt dikirim ke server AI. Data ini tidak disimpan oleh Modulajar." },
              ].map((p) => (
                <div key={p.name} className="border border-gray-200 rounded-xl px-4 py-3">
                  <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                  <p className="text-gray-600 text-xs leading-relaxed mt-0.5">{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Cara Mengelola atau Menolak Cookie</h2>
            <p>Ada beberapa cara untuk mengelola preferensi cookie Anda:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 text-xs">
              <li><strong>Banner Cookie:</strong> Saat pertama kali mengakses Modulajar, Anda akan melihat banner cookie. Klik "Terima" untuk mengaktifkan analitik, atau "Tolak" untuk menonaktifkannya.</li>
              <li><strong>Pengaturan Browser:</strong> Setiap browser memungkinkan Anda memblokir atau menghapus cookie melalui pengaturan browser (biasanya di Preferences → Privacy).</li>
              <li><strong>Opt-out PostHog:</strong> Kunjungi <a href="https://posthog.com/privacy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">posthog.com/privacy</a> untuk menonaktifkan analitik PostHog.</li>
              <li><strong>Mode PWA Offline:</strong> Saat menggunakan Modulajar dalam mode offline (PWA), cookie analitik tidak akan aktif karena tidak ada koneksi internet.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Dampak Menonaktifkan Cookie</h2>
            <p>Jika Anda menonaktifkan semua cookie:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 text-xs">
              <li>Anda harus login setiap kali mengakses halaman baru.</li>
              <li>Pengaturan preferensi (bahasa, tema) tidak akan disimpan.</li>
              <li>Cookie analitik non-aktif (tidak ada dampak pada fungsionalitas).</li>
              <li>Cookie keamanan payment gateway tetap aktif untuk keamanan transaksi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Perubahan Kebijakan</h2>
            <p>Kami dapat memperbarui Kebijakan Cookie ini sewaktu-waktu. Perubahan akan diumumkan di halaman ini dengan tanggal "Terakhir diperbarui" yang diperbarui.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. Kontak</h2>
            <p>Jika Anda memiliki pertanyaan tentang Kebijakan Cookie ini, hubungi kami:</p>
            <p className="mt-2">
              <strong>CV. Artesis Sinar Endah Perdana</strong><br />
              Email: <a href="mailto:hello@modulajar.app" className="text-indigo-600 hover:underline">hello@modulajar.app</a>
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <a href="/register" className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 text-center">
            Mulai Daftar →
          </a>
          <a href="/privacy" className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg font-medium hover:bg-gray-50 text-center">
            Kebijakan Privasi
          </a>
        </div>
      </main>
    </div>
  );
}
