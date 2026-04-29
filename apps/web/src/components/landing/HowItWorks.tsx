
const STEPS = [
  { num: "01", title: "Input Topik & Fase", desc: "Masukkan topik pelajaran, fase, dan alokasi waktu. AI menyesuaikan dengan kurikulum." },
  { num: "02", title: "AI Generate Konten", desc: "CP, TP, ATP, kegiatan, dan asesmen lengkap dibuat otomatis dalam hitungan detik." },
  { num: "03", title: "Edit & Export PDF", desc: "Review hasilnya, edit bagian yang perlu penyesuaian, lalu download sebagai PDF siap pakai." },
];

const FEATURES = [
  { icon: "⚡", title: "Generate dalam 60 Detik", desc: "Capaian Pembelajaran, Tujuan Pembelajaran, Alur TP, dan Asesmen dibuat otomatis." },
  { icon: "📋", title: "Sesuai Kurikulum Merdeka", desc: "Output sesuai format Kurikulum Merdeka dengan 11 sections lengkap." },
  { icon: "📄", title: "Export PDF A4", desc: "Download modul sebagai PDF siap cetak dalam format resmi Kurikulum Merdeka." },
  { icon: "🎯", title: "Diferensiasi Otomatis", desc: "AI membuat 3 versi kegiatan untuk Visual, Auditori, dan Kinestetik." },
  { icon: "🔄", title: "Perbaharui Otomatis", desc: "Ketika BS KAP diupdate, modul ditandai perlu review dan bisa dimigrate." },
  { icon: "💳", title: "Berbayar Mulai Rp 49rb", desc: "Plan Free 2 modul/bulan. Plan Go Rp 49.000/bulan — 10 modul + PDF tanpa watermark." },
];

export function HowItWorks() {
  return (
    <section id="cara-kerja" style={{ padding: "72px 0", background: "#fafafa" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: "12px" }}>
            Cara Kerja
          </h2>
          <p style={{ fontSize: "17px", color: "#6b7280", maxWidth: "440px", margin: "0 auto" }}>
            Tiga langkah mudah untuk membuat modul ajar berkualitas
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", maxWidth: "860px", margin: "0 auto" }}>
          {STEPS.map((s) => (
            <div key={s.num} style={{
              background: "#fff", borderRadius: "14px", padding: "24px 20px",
              border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: "40px", height: "40px", background: "#111827", color: "#fff",
                borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700, marginBottom: "14px",
              }}>{s.num}</div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>{s.title}</h3>
              <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section id="fitur" style={{ padding: "72px 0" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: "12px" }}>
            Fitur Lengkap
          </h2>
          <p style={{ fontSize: "17px", color: "#6b7280", maxWidth: "440px", margin: "0 auto" }}>
            Semua yang guru butuhkan untuk membuat modul ajar profesional
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: "#fff", borderRadius: "14px", padding: "22px 20px",
              border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
            }}>
              <div style={{ fontSize: "26px", marginBottom: "10px" }}>{f.icon}</div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>{f.title}</h3>
              <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.55 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
