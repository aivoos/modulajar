import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ padding: "48px 0", background: "#fafafa", borderTop: "1px solid #e5e7eb" }}>
      <div className="container">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "36px",
          marginBottom: "36px",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg, #4f46e5, #4338ca)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
                  <path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM13 12l3 3M16 12l-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>Modulajar</span>
            </div>
            <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.6 }}>
              Platform AI untuk guru Indonesia. Buat modul ajar Kurikulum Merdeka dalam hitungan detik.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "10px" }}>Produk</h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {[["Fitur", "/#fitur"], ["Harga", "/pricing"], ["Blog", "/blog/cara-buat-modul-ajar"]].map(([label, href]) => (
                <li key={label} style={{ marginBottom: "7px" }}>
                  <Link href={href} style={{ fontSize: "13px", color: "#6b7280" }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "10px" }}>Legal</h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {[["Kebijakan Privasi", "/privacy"], ["Syarat & Ketentuan", "/terms"], ["Kebijakan Cookie", "/cookies"], ["Refund", "/refund"]].map(([label, href]) => (
                <li key={label} style={{ marginBottom: "7px" }}>
                  <Link href={href} style={{ fontSize: "13px", color: "#6b7280" }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{
          paddingTop: "22px", borderTop: "1px solid #e5e7eb",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "10px",
        }}>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>
            © {year} Modulajar. CV. Artesis Sinar Endah Perdana.
          </p>
        </div>
      </div>
    </footer>
  );
}
