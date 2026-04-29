import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, #fafafa 0%, #ffffff 60%)",
          zIndex: 0,
        }}
      />
      {/* Decorative blobs */}
      <div aria-hidden style={{
        position: "absolute", top: "-15%", right: "-8%", width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />
      <div aria-hidden style={{
        position: "absolute", bottom: "-10%", left: "-5%", width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center", paddingTop: "72px", paddingBottom: "80px" }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 14px",
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: "9999px", marginBottom: "28px",
          }}>
            <span style={{
              width: "6px", height: "6px",
              background: "#22c55e", borderRadius: "50%",
              boxShadow: "0 0 8px rgba(34,197,94,0.6)",
            }} />
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#166534" }}>
              Gratis 2 modul/bulan — tanpa kartu kredit
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(40px, 6vw, 64px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "#111827",
            marginBottom: "20px",
          }}>
            Modul Ajar Kurikulum Merdeka
            <br />
            <span style={{ color: "#6b7280" }}>dalam 60 Detik</span>
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "#6b7280",
            lineHeight: 1.7,
            marginBottom: "36px",
            maxWidth: "520px",
            margin: "0 auto 36px",
          }}>
            AI membuat Capaian Pembelajaran, Tujuan Pembelajaran, Alur TP, Kegiatan,
            dan Asesmen — otomatis sesuai format BS KAP.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "28px" }}>
            <Link href="/register" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 24px",
              background: "#111827", color: "#fff",
              fontSize: "15px", fontWeight: 600,
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transition: "all 0.15s ease",
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              Buat Modul Gratis
            </Link>
            <Link href="/#cara-kerja" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 24px",
              background: "#fff", color: "#374151",
              fontSize: "15px", fontWeight: 600,
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Lihat Demo
            </Link>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#f59e0b">
                  <path d="M7 1l1.8 3.6 3.9.6-2.8 2.7.7 3.9L7 9.8 4.4 11.8l.7-3.9L1.3 5.2l3.9-.6z"/>
                </svg>
              ))}
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>4.8/5</span>
              <span style={{ fontSize: "13px", color: "#9ca3af" }}>rating guru</span>
            </div>
            <span style={{ color: "#e5e7eb" }}>·</span>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>342+ guru aktif</span>
            <span style={{ color: "#e5e7eb" }}>·</span>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>Sesuai BS KAP</span>
          </div>
        </div>
      </div>
    </section>
  );
}
