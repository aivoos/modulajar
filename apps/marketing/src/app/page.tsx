import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ background: "#ffffff", minHeight: "100vh" }}>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #f3f4f6",
      }}>
        <div className="container">
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            height: "64px",
          }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px",
                background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM13 12l3 3M16 12l-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: "16px", color: "#111827" }}>Modulajar</span>
            </Link>

            <nav style={{ display: "flex", alignItems: "center", gap: "32px" }}>
              <Link href="/#fitur" style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>Fitur</Link>
              <Link href="/pricing" style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>Harga</Link>
              <Link href="/blog/cara-buat-modul-ajar" style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>Blog</Link>
              <Link href="/register" style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "8px 20px",
                background: "#111827", color: "#fff",
                fontSize: "14px", fontWeight: 600,
                borderRadius: "8px",
              }}>
                Mulai Gratis
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section style={{
        position: "relative", overflow: "hidden",
        paddingTop: "80px", paddingBottom: "80px",
        background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
      }}>
        {/* Subtle gradient blobs */}
        <div aria-hidden style={{
          position: "absolute", top: "-20%", right: "-10%", width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}/>
        <div aria-hidden style={{
          position: "absolute", bottom: "-10%", left: "-5%", width: "500px", height: "500px",
          background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}/>

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>

            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 14px",
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: "9999px", marginBottom: "32px",
            }}>
              <span style={{
                width: "6px", height: "6px",
                background: "#22c55e", borderRadius: "50%",
                boxShadow: "0 0 8px rgba(34,197,94,0.5)",
              }}/>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#166534" }}>
                Gratis 2 modul/bulan — tanpa kartu kredit
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: "clamp(36px, 6vw, 60px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#111827",
              marginBottom: "24px",
            }}>
              Modul Ajar Kurikulum Merdeka
              <br/>
              <span style={{ color: "#6b7280" }}>dalam 60 Detik</span>
            </h1>

            {/* Subheadline */}
            <p style={{
              fontSize: "clamp(16px, 2vw, 19px)",
              color: "#6b7280",
              lineHeight: 1.65,
              marginBottom: "40px",
              maxWidth: "560px",
              margin: "0 auto 40px",
            }}>
              AI membuat Capaian Pembelajaran, Tujuan Pembelajaran, Alur TP, Kegiatan,
              dan Asesmen — otomatis sesuai format BS KAP.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "32px" }}>
              <Link href="/register" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "12px 24px",
                background: "#111827", color: "#fff",
                fontSize: "15px", fontWeight: 600,
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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
              }}>
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

      {/* ── Mockup ─────────────────────────────────────────── */}
      <section style={{ paddingBottom: "80px", background: "linear-gradient(180deg, #f9fafb 0%, #ffffff 100%)" }}>
        <div className="container">
          <div style={{
            maxWidth: "900px", margin: "0 auto",
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.03), 0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}>
            {/* Chrome bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "12px 16px",
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
            }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f87171" }}/>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#fbbf24" }}/>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#34d399" }}/>
            </div>

            {/* App content */}
            <div style={{ padding: "40px 32px", background: "#fafafa" }}>
              <div style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "24px 28px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <div style={{ width: "120px", height: "14px", background: "#e5e7eb", borderRadius: "6px", marginBottom: "6px" }}/>
                    <div style={{ width: "200px", height: "10px", background: "#f3f4f6", borderRadius: "4px" }}/>
                  </div>
                  <div style={{ width: "80px", height: "28px", background: "#4f46e5", borderRadius: "6px" }}/>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#f3f4f6", borderRadius: "4px", marginBottom: "8px" }}/>
                <div style={{ width: "100%", height: "8px", background: "#f3f4f6", borderRadius: "4px", marginBottom: "8px" }}/>
                <div style={{ width: "75%", height: "8px", background: "#f3f4f6", borderRadius: "4px", marginBottom: "20px" }}/>
                <div style={{ width: "100%", height: "32px", background: "#111827", borderRadius: "8px" }}/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cara Kerja ─────────────────────────────────────── */}
      <section id="cara-kerja" style={{ padding: "80px 0", background: "#fafafa" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: "12px" }}>
              Cara Kerja
            </h2>
            <p style={{ fontSize: "17px", color: "#6b7280", maxWidth: "480px", margin: "0 auto" }}>
              Tiga langkah mudah untuk membuat modul ajar berkualitas
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
            maxWidth: "900px",
            margin: "0 auto",
          }}>
            {[
              { num: "01", title: "Input Topik & Fase", desc: "Masukkan topik pelajaran, fase, dan alokasi waktu. AI akan menyesuaikan dengan kurikulum." },
              { num: "02", title: "AI Generate Konten", desc: "Dalam hitungan detik, AI membuat CP, TP, ATP, kegiatan pembelajaran, dan asesmen lengkap." },
              { num: "03", title: "Edit & Export PDF", desc: "Review hasilnya, lalu download modul ajar dalam format PDF siap pakai." },
            ].map((step, i) => (
              <div key={i} style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "28px 24px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  width: "40px", height: "40px",
                  background: "#111827",
                  color: "#fff",
                  borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 700,
                  marginBottom: "16px",
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>{step.title}</h3>
                <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fitur ───────────────────────────────────────────── */}
      <section id="fitur" style={{ padding: "80px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: "12px" }}>
              Fitur Lengkap
            </h2>
            <p style={{ fontSize: "17px", color: "#6b7280", maxWidth: "480px", margin: "0 auto" }}>
              Semua yang Anda butuhkan untuk membuat modul ajar profesional
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}>
            {[
              { icon: "📋", title: "CP & TP Otomatis", desc: "Capaian dan Tujuan Pembelajaran di-generate sesuai fase dan topik." },
              { icon: "📊", title: "Alur TP Terstruktur", desc: "Alur Tujuan Pembelajaran dengan pendekatan yang logis dan sistematis." },
              { icon: "🎯", title: "Kegiatan Berbasis CP", desc: "Kegiatan pembelajaran yang selaras dengan Capaian Pembelajaran." },
              { icon: "📝", title: "Asesmen Lengkap", desc: "Instrumen asesmen diagnostik, formatif, dan sumatif." },
              { icon: "🎨", title: "Model Pembelajaran", desc: "Problem Based Learning, Project Based Learning, dan lainnya." },
              { icon: "⚙️", title: "Sesuai BS KAP", desc: "Format mengikuti Buku Sumber Capaian Pembelajaran resmi." },
            ].map((f, i) => (
              <div key={i} style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "24px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                transition: "box-shadow 0.2s ease",
              }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.55 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coming Soon ────────────────────────────────────── */}
      <section style={{
        padding: "56px 0",
        background: "#111827",
      }}>
        <div className="container" style={{ textAlign: "center" }}>
          <p style={{
            display: "inline-block",
            fontSize: "12px", fontWeight: 600,
            color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: "12px",
          }}>
            Coming Soon
          </p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>
            Fitur yang akan datang
          </h2>
          <p style={{ fontSize: "16px", color: "#6b7280", maxWidth: "480px", margin: "0 auto" }}>
            Bank Soal AI, Template RPP, Modul Ajar Berbagi, dan Integrasi LMS sekolah
          </p>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: "12px" }}>
              Harga Terjangkau
            </h2>
            <p style={{ fontSize: "17px", color: "#6b7280", maxWidth: "480px", margin: "0 auto" }}>
              Mulai gratis, upgrade kapan saja
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
            maxWidth: "900px",
            margin: "0 auto",
          }}>
            {/* Free */}
            <div style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "28px 24px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Gratis</h3>
              <div style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "36px", fontWeight: 800, color: "#111827" }}>Rp 0</span>
                <span style={{ fontSize: "14px", color: "#9ca3af" }}>/bulan</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "24px" }}>
                {["2 modul/bulan", "Export PDF", "Format BS KAP"].map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#22c55e" style={{ flexShrink: 0, marginTop: "1px" }}>
                      <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd"/>
                    </svg>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" style={{
                display: "block", textAlign: "center",
                padding: "10px",
                background: "#f9fafb", color: "#111827",
                fontSize: "14px", fontWeight: 600,
                borderRadius: "8px", border: "1px solid #e5e7eb",
              }}>
                Mulai Gratis
              </Link>
            </div>

            {/* Pro */}
            <div style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "28px 24px",
              border: "2px solid #111827",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                padding: "4px 12px",
                background: "#111827", color: "#fff",
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                borderRadius: "9999px",
              }}>
                Populer
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Pro</h3>
              <div style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "36px", fontWeight: 800, color: "#111827" }}>Rp 49k</span>
                <span style={{ fontSize: "14px", color: "#9ca3af" }}>/bulan</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "24px" }}>
                {["20 modul/bulan", "Semua fitur Gratis", "Prioritas support", "Template premium"].map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#22c55e" style={{ flexShrink: 0, marginTop: "1px" }}>
                      <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd"/>
                    </svg>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=pro" style={{
                display: "block", textAlign: "center",
                padding: "10px",
                background: "#111827", color: "#fff",
                fontSize: "14px", fontWeight: 600,
                borderRadius: "8px",
              }}>
                Pilih Pro
              </Link>
            </div>

            {/* School */}
            <div style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "28px 24px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Sekolah</h3>
              <div style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "36px", fontWeight: 800, color: "#111827" }}>Custom</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "24px" }}>
                {["Unlimited modul", "Multi-user", "Integrasi LMS"].map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#22c55e" style={{ flexShrink: 0, marginTop: "1px" }}>
                      <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd"/>
                    </svg>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact" style={{
                display: "block", textAlign: "center",
                padding: "10px",
                background: "#f9fafb", color: "#111827",
                fontSize: "14px", fontWeight: 600,
                borderRadius: "8px", border: "1px solid #e5e7eb",
              }}>
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section style={{ padding: "80px 0", background: "#fafafa" }}>
        <div className="container" style={{ maxWidth: "680px" }}>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#111827",
            letterSpacing: "-0.02em", textAlign: "center", marginBottom: "48px",
          }}>
            Pertanyaan Umum
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { q: "Apakah Modulajar gratis?", a: "Ya, Anda bisa membuat 2 modul/bulan secara gratis. Untuk kebutuhan lebih banyak, upgrade ke paket Pro." },
              { q: "Apakah sesuai BS KAP?", a: "Ya, semua modul ajar di-generate mengikuti format Buku Sumber Capaian Pembelajaran (BS KAP) resmi." },
              { q: "Berapa lama membuat modul?", a: "Rata-rata 60 detik untuk modul lengkap (CP, TP, ATP, Kegiatan, Asesmen)." },
              { q: "Bisa edit hasilnya?", a: "Tentu saja. Hasil AI bisa diedit langsung sebelum didownload sebagai PDF." },
            ].map((item, i) => (
              <details key={i} style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}>
                <summary style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "18px 20px",
                  cursor: "pointer",
                  fontSize: "15px", fontWeight: 600, color: "#111827",
                  listStyle: "none",
                }}>
                  {item.q}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "#9ca3af", flexShrink: 0 }}>
                    <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M4 6l4 4 4-4"/>
                  </svg>
                </summary>
                <div style={{ padding: "0 20px 18px", fontSize: "14px", color: "#6b7280", lineHeight: 1.65 }}>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ────────────────────────────────────────── */}
      <section style={{
        padding: "72px 0",
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
      }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{
            fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800,
            color: "#fff", letterSpacing: "-0.02em",
            marginBottom: "16px",
          }}>
            Siap membuat modul ajar pertama Anda?
          </h2>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.6)", marginBottom: "32px" }}>
            Gratis 2 modul/bulan. Tanpa kartu kredit.
          </p>
          <Link href="/register" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "14px 28px",
            background: "#fff", color: "#111827",
            fontSize: "15px", fontWeight: 700,
            borderRadius: "10px",
          }}>
            Daftar Gratis Sekarang
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ padding: "48px 0", background: "#fafafa", borderTop: "1px solid #e5e7eb" }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "40px",
            marginBottom: "40px",
          }}>
            {/* Brand col */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{
                  width: "28px", height: "28px",
                  background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                  borderRadius: "7px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
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

            {/* Links */}
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "12px" }}>Produk</h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {["Fitur", "Harga", "Blog"].map((link) => (
                  <li key={link} style={{ marginBottom: "8px" }}>
                    <Link href={link === "Fitur" ? "/#fitur" : link === "Harga" ? "/pricing" : "/blog/cara-buat-modul-ajar"} style={{ fontSize: "13px", color: "#6b7280" }}>{link}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "12px" }}>Legal</h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {[["Privasi", "/privacy"], ["Syarat", "/terms"], ["Cookie", "/cookies"], ["Refund", "/refund"]].map(([label, href]) => (
                  <li key={label} style={{ marginBottom: "8px" }}>
                    <Link href={href} style={{ fontSize: "13px", color: "#6b7280" }}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{
            paddingTop: "24px",
            borderTop: "1px solid #e5e7eb",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: "12px",
          }}>
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>
              © {new Date().getFullYear()} Modulajar. CV. Artesis Sinar Endah Perdana.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
