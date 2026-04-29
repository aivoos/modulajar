import Link from "next/link";

const FAQS = [
  { q: "Apakah Modulajar gratis?", a: "Ya, Anda bisa membuat 2 modul/bulan secara gratis. Untuk kebutuhan lebih banyak, upgrade ke paket Pro." },
  { q: "Apakah sesuai BS KAP?", a: "Ya, semua modul ajar di-generate mengikuti format Buku Sumber Capaian Pembelajaran (BS KAP) resmi." },
  { q: "Berapa lama membuat modul?", a: "Rata-rata 60 detik untuk modul lengkap (CP, TP, ATP, Kegiatan, Asesmen)." },
  { q: "Bisa edit hasilnya?", a: "Tentu saja. Hasil AI bisa diedit langsung sebelum didownload sebagai PDF." },
];

export function FAQ() {
  return (
    <section style={{ padding: "72px 0", background: "#fafafa" }}>
      <div className="container" style={{ maxWidth: "680px" }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", textAlign: "center", marginBottom: "40px" }}>
          Pertanyaan Umum
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {FAQS.map((item, i) => (
            <details key={i} style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <summary style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", cursor: "pointer",
                fontSize: "14px", fontWeight: 600, color: "#111827", listStyle: "none",
              }}>
                {item.q}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "#9ca3af", flexShrink: 0 }}>
                  <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M4 6l4 4 4-4"/>
                </svg>
              </summary>
              <div style={{ padding: "0 20px 16px", fontSize: "14px", color: "#6b7280", lineHeight: 1.65 }}>
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section style={{ padding: "72px 0" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: "12px" }}>
            Harga Terjangkau
          </h2>
          <p style={{ fontSize: "17px", color: "#6b7280", maxWidth: "440px", margin: "0 auto" }}>
            Mulai gratis, upgrade kapan saja
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", maxWidth: "860px", margin: "0 auto" }}>
          {[
            { name: "Free", price: "Rp 0", items: ["2 modul/bulan", "Export PDF", "Format BS KAP"], highlight: false, cta: "Mulai Gratis", dark: false },
            { name: "Pro", price: "Rp 49k", items: ["20 modul/bulan", "Semua fitur Free", "Prioritas support", "Template premium"], highlight: true, cta: "Pilih Pro", dark: false },
            { name: "Sekolah", price: "Custom", items: ["Unlimited modul", "Multi-user", "Integrasi LMS"], highlight: false, cta: "Hubungi Kami", dark: false },
          ].map((plan) => (
            <div key={plan.name} style={{
              background: "#fff",
              borderRadius: "14px", padding: "26px 22px",
              border: plan.highlight ? "2px solid #111827" : "1px solid #e5e7eb",
              boxShadow: plan.highlight ? "0 4px 16px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
              position: "relative",
            }}>
              {plan.highlight && (
                <div style={{
                  position: "absolute", top: "-11px", left: "50%", transform: "translateX(-50%)",
                  padding: "3px 12px", background: "#111827", color: "#fff",
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                  borderRadius: "9999px",
                }}>Populer</div>
              )}
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>{plan.name}</h3>
              <div style={{ marginBottom: "18px" }}>
                <span style={{ fontSize: "32px", fontWeight: 800, color: "#111827" }}>{plan.price}</span>
                <span style={{ fontSize: "13px", color: "#9ca3af" }}>/bulan</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "22px" }}>
                {plan.items.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "9px" }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="#22c55e" style={{ flexShrink: 0, marginTop: "1px" }}>
                      <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd"/>
                    </svg>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" style={{
                display: "block", textAlign: "center",
                padding: "10px",
                background: plan.highlight ? "#111827" : "#f9fafb",
                color: plan.highlight ? "#fff" : "#111827",
                fontSize: "14px", fontWeight: 600,
                borderRadius: "8px",
                border: plan.highlight ? "none" : "1px solid #e5e7eb",
              }}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
