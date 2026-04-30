import { useState, useEffect, useRef } from "react";

// ─── THEME SYSTEM ─────────────────────────────────────────────────────────────
const BRAND = {
  indigo: "#4F46E5", indigoDark: "#4338CA", indigoLight: "#EEF2FF",
  amber: "#F59E0B", amberLight: "#FFFBEB",
  emerald: "#10B981", emeraldLight: "#ECFDF5",
  red: "#EF4444", redLight: "#FEF2F2",
  purple: "#8B5CF6", purpleLight: "#F5F3FF",
  cyan: "#06B6D4",
};

const LIGHT = {
  bg: "#F8FAFC", bgAlt: "#F1F5F9",
  surface: "#FFFFFF", surfaceHover: "#F8FAFC",
  border: "#E2E8F0", borderStrong: "#CBD5E1",
  text: "#0F172A", textSub: "#475569", textMuted: "#94A3B8",
  navBg: "rgba(255,255,255,0.92)", navBorder: "#E2E8F0",
  heroBg: `linear-gradient(145deg, #4338CA 0%, #4F46E5 50%, #6D28D9 100%)`,
  cardShadow: "0 1px 4px rgba(0,0,0,0.06)",
  invertText: "#FFFFFF",
};

const DARK = {
  bg: "#0D1117", bgAlt: "#111827",
  surface: "#161B27", surfaceHover: "#1A2030",
  border: "#21293A", borderStrong: "#2D3B4E",
  text: "#F1F5F9", textSub: "#94A3B8", textMuted: "#475569",
  navBg: "rgba(13,17,23,0.92)", navBorder: "#21293A",
  heroBg: `linear-gradient(145deg, #312E81 0%, #3730A3 50%, #4C1D95 100%)`,
  cardShadow: "0 1px 4px rgba(0,0,0,0.4)",
  invertText: "#FFFFFF",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
// Ref: modulajar-spec-v3.jsx — SSOT Pricing
// Free: 3× lifetime trial | Pro: Rp 99k/mo, Rp 494k/6mo, Rp 790k/thn, 30× AI gen/bulan | Sekolah: tiered per-guru
const PLANS = [
  {
    key:"free", label:"Free", price:0, yearly:0,
    desc:"Untuk coba",
    features:["3× AI generate modul (lifetime trial)","Preview di aplikasi","Akses curated library (baca saja)"],
    locked:["Download PDF","Jurnal Harian","Input Nilai","Bukti PMM"],
    cta:"Mulai Gratis", featured:false,
    limitsNote:"3× lifetime — setelah itu upgrade",
  },
  {
    key:"pro", label:"Pro", price:99000, price6mo:494000, priceYearly:790000, monthlyGen:30,
    desc:"Untuk guru aktif",
    badge:"Paling Populer",
    features:["30× AI generate modul/bulan (GPT-4o mini)","Download PDF (A4, siap cetak)","Jurnal Harian (harian, 60 detik)","Absensi siswa per kelas","Input Nilai + Deskripsi AI","Paket Bukti PMM (ZIP untuk upload ke PMM)","Push notification reminder jurnal"],
    locked:[],
    cta:"Berlangganan Pro", featured:true,
    anchor:"Rp 99.000/bulan — lebih murah dari segelas kopi",
  },
  {
    key:"school", label:"Sekolah", pricePerGuruMin:49000,
    desc:"Untuk sekolah (B2B)",
    tiers:[
      { label:"3-10 guru",   price:89000, per:"guru/bulan" },
      { label:"11-25 guru",  price:79000, per:"guru/bulan" },
      { label:"26-50 guru",  price:69000, per:"guru/bulan" },
      { label:"51-100 guru", price:59000, per:"guru/bulan" },
      { label:"100+ guru",   price:49000, per:"guru/bulan" },
    ],
    minGuru:3,
    features:["Semua fitur Pro untuk semua guru","Dashboard Kepala Sekolah","Upload master jadwal sekolah","Laporan compliance kurikulum semua guru","Invoice resmi BOS (NPWP, PPN 11%)","Onboarding guru oleh tim kami","School invite: kepala sekolah invite guru"],
    locked:[],
    cta:"Hubungi Kami", featured:false,
    anchor:"Mulai Rp 49.000/guru/bulan — 51% discount dari Pro",
  },
];

const STEPS = [
  { num:"01", icon:"🎯", title:"Isi info dasar", desc:"Pilih mata pelajaran, fase, kelas, dan topik. Selesai dalam 2 menit.", color:BRAND.indigo },
  { num:"02", icon:"🤖", title:"AI bekerja untukmu", desc:"6 AI agent menyusun CP, TP, ATP, kegiatan, dan asesmen secara otomatis.", color:BRAND.amber },
  { num:"03", icon:"📄", title:"Download & pakai", desc:"Modul ajar lengkap format Kemendikbud siap cetak dalam kurang dari 60 detik.", color:BRAND.emerald },
];

const FAQS = [
  // Ref: modulajar-spec-v3.jsx — FAQ aligned with spec v3
  { q:"Apakah Modulajar sesuai Kurikulum Merdeka?", a:"Ya. CP, TP, dan ATP dari BSKAP Kemendikbud. AI agent menyusun modul sesuai struktur Kurikulum Merdeka resmi." },
  { q:"Berapa lama AI membuat satu modul?", a:"Rata-rata 30–60 detik untuk modul lengkap (CP→TP→ATP→Kegiatan→Asesmen). Kamu bisa pantau 6 langkah realtime." },
  { q:"Apakah perlu pengalaman teknologi?", a:"Tidak. Dirancang untuk guru Indonesia. Kalau bisa pakai WhatsApp, kamu bisa pakai Modulajar." },
  { q:"Bagaimana cara bayar?", a:"QRIS, GoPay, OVO, Dana, ShopeePay, VA BCA/Mandiri/BNI, Indomaret, Alfamart. Annual billing — satu keputusan per tahun." },
  { q:"Apakah data modul saya aman?", a:"Data tersimpan di Supabase (AWS Singapore). Tidak ada model yang train dari data kamu." },
  { q:"Bisa dibatalkan kapan saja?", a:"Ya. Cancel anytime — akses tetap aktif sampai akhir periode. Tidak ada biaya tersembunyi." },
  { q:"Apa itu Bukti Kinerja PMM?", a:"ZIP berisi rekap jurnal + nilai + modul + refleksi siap upload ke Platform Merdeka Mengajar. 1 klik." },
  { q:"Berapa kuota AI per bulan?", a:"Plan Pro: 30× AI generate/bulan. Plan Sekolah: 30×/guru/bulan. Top-up Rp 10.000 = +3 modul." },
];

const COMING = [
  // Ref: modulajar-spec-v3.jsx — Sprint 2+
  { icon:"🤖", text:"Teacher Assistant Chatbot (Eliza OS)" },
  { icon:"📱", text:"PWA Offline Mode" },
  { icon:"📊", text:"Prota & Promes AI" },
  { icon:"📝", text:"Bank Soal AI" },
];

const SUBJECTS = ["Matematika","IPA","IPS","Bahasa Indonesia","Bahasa Inggris","PPKN","Seni Budaya","PJOK","Informatika"];

const AI_STEPS = [
  { label:"Membaca Capaian Pembelajaran", done:true },
  { label:"Menyusun Tujuan Pembelajaran (ABCD)", done:true },
  { label:"Membuat Alur Pembelajaran", active:true },
  { label:"Menyusun Kegiatan", done:false },
  { label:"Membuat Instrumen Asesmen", done:false },
  { label:"Validasi Kurikulum Merdeka", done:false },
];

export default function MarketingPage() {
  const [dark, setDark] = useState(false);
  const [billing, setBilling] = useState("monthly"); // "monthly" | "6mo" | "yearly"
  const [openFaq, setOpenFaq] = useState(null);
  const [navSolid, setNavSolid] = useState(false);
  const [count, setCount] = useState(0);

  const T = dark ? DARK : LIGHT;

  useEffect(() => {
    let n = 0; const target = 3847; const step = Math.ceil(target / 60);
    const timer = setInterval(() => { n = Math.min(n + step, target); setCount(n); if (n >= target) clearInterval(timer); }, 30);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fmt = (n) => "Rp " + n.toLocaleString("id-ID");

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:T.bg, color:T.text, lineHeight:1.6, overflowX:"hidden", transition:"background 0.25s, color 0.25s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .float{animation:float 4s ease-in-out infinite;}
        .fadeUp{animation:fadeUp .6s ease forwards;}
        .hov-card{transition:transform .15s,box-shadow .15s;}
        .hov-card:hover{transform:translateY(-3px);}
        .hov-btn{transition:opacity .15s,transform .15s;}
        .hov-btn:hover{opacity:.88;transform:translateY(-1px);}
        .hov-chip:hover{background:${BRAND.indigo}!important;color:#fff!important;}
        .hov-chip{transition:all .15s;}
        .hov-faq:hover{background:${dark?"rgba(79,70,229,.12)":"#EEF2FF"}!important;}
        a{text-decoration:none;}
      `}</style>

      {/* NAV */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:navSolid?T.navBg:"transparent", backdropFilter:navSolid?"blur(14px)":"none", borderBottom:navSolid?`1px solid ${T.navBorder}`:"none", transition:"all .3s", padding:"0 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:32, height:32, background:`linear-gradient(135deg,${BRAND.indigo},${BRAND.amber})`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📚</div>
            <span style={{ fontWeight:800, fontSize:18, color:navSolid?T.text:"#FFF", letterSpacing:-.5, transition:"color .2s" }}>modulajar</span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {["Harga","FAQ"].map(l => <a key={l} href={`#${l.toLowerCase()}`} style={{ padding:"8px 14px", color:navSolid?T.textSub:"rgba(255,255,255,.8)", fontSize:14, fontWeight:600 }}>{l}</a>)}
            {/* Dark mode toggle */}
            <button onClick={()=>setDark(d=>!d)} style={{ width:36, height:36, borderRadius:10, background:navSolid?(dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)"):"rgba(255,255,255,.12)", border:`1px solid ${navSolid?T.border:"rgba(255,255,255,.2)"}`, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {dark ? "☀️" : "🌙"}
            </button>
            <button className="hov-btn" style={{ padding:"9px 20px", background:BRAND.amber, color:"#1A1200", borderRadius:9, fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>Mulai Gratis</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background:T.heroBg, padding:"140px 24px 100px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-100, right:-100, width:500, height:500, background:"rgba(245,158,11,.07)", borderRadius:"50%", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-150, left:-150, width:600, height:600, background:"rgba(16,185,129,.05)", borderRadius:"50%", pointerEvents:"none" }} />
        <div style={{ maxWidth:840, margin:"0 auto", textAlign:"center", position:"relative" }}>
          <div className="fadeUp" style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(245,158,11,.15)", border:"1px solid rgba(245,158,11,.3)", borderRadius:99, padding:"5px 14px", marginBottom:24 }}>
            <span style={{ width:6, height:6, background:BRAND.amber, borderRadius:"50%", animation:"pulse 2s infinite" }} />
            <span style={{ fontSize:13, fontWeight:600, color:BRAND.amber }}>AI untuk Guru Indonesia 🇮🇩</span>
          </div>
          <h1 className="fadeUp" style={{ fontSize:"clamp(36px,6vw,68px)", fontWeight:900, color:"#FFF", lineHeight:1.1, letterSpacing:-2, marginBottom:20 }}>
            Modul Ajar Kurikulum Merdeka<br/><span style={{ color:BRAND.amber }}>dalam 60 Detik</span>
          </h1>
          <p className="fadeUp" style={{ fontSize:"clamp(16px,2.5vw,20px)", color:"rgba(255,255,255,.75)", maxWidth:580, margin:"0 auto 36px", lineHeight:1.7 }}>
            AI yang memahami CP, TP, dan ATP — bukan guru yang harus menghafalnya. Buat modul, isi jurnal, dan siapkan bukti PMM dari satu tempat.
          </p>
          <div className="fadeUp" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <button className="hov-btn" style={{ padding:"14px 32px", background:BRAND.amber, color:"#1A1200", borderRadius:12, fontSize:16, fontWeight:700, border:"none", cursor:"pointer", boxShadow:"0 8px 32px rgba(245,158,11,.35)" }}>Coba Gratis Sekarang ✨</button>
            <button className="hov-btn" style={{ padding:"14px 28px", background:"rgba(255,255,255,.1)", color:"#FFF", borderRadius:12, fontSize:16, fontWeight:600, border:"1px solid rgba(255,255,255,.2)", cursor:"pointer" }}>Lihat Contoh Modul →</button>
          </div>
          <div className="fadeUp" style={{ display:"flex", gap:32, justifyContent:"center", marginTop:56, flexWrap:"wrap" }}>
            {[{ val:count.toLocaleString("id-ID")+"+", label:"Modul dibuat" },{ val:"< 60 dtk", label:"Rata-rata generate" },{ val:"Gratis", label:"Untuk memulai" }].map(s => (
              <div key={s.label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:28, fontWeight:800, color:"#FFF" }}>{s.val}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUBJECTS TICKER */}
      <div style={{ background:T.bgAlt, borderBottom:`1px solid ${T.border}`, padding:"14px 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:12, fontWeight:600, color:T.textMuted }}>Tersedia untuk:</span>
          {SUBJECTS.map(s => (
            <span key={s} className="hov-chip" style={{ padding:"4px 12px", background:dark?"rgba(79,70,229,.2)":BRAND.indigoLight, color:BRAND.indigo, borderRadius:99, fontSize:12, fontWeight:600, cursor:"default" }}>{s}</span>
          ))}
          <span style={{ padding:"4px 12px", background:T.surface, color:T.textSub, borderRadius:99, fontSize:12, fontWeight:600, border:`1px solid ${T.border}` }}>Fase A – F</span>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding:"96px 24px", background:T.bg }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <span style={{ fontSize:12, fontWeight:700, color:BRAND.indigo, letterSpacing:2, textTransform:"uppercase" }}>Cara Kerja</span>
            <h2 style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:800, marginTop:8, letterSpacing:-1 }}>3 langkah, modul ajar siap</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:18 }}>
            {STEPS.map(s => (
              <div key={s.num} className="hov-card" style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:20, padding:"32px 28px", position:"relative", overflow:"hidden", boxShadow:T.cardShadow }}>
                <div style={{ position:"absolute", top:-16, right:-10, fontSize:72, opacity:.04, fontWeight:900, color:s.color, fontFamily:"monospace", lineHeight:1 }}>{s.num}</div>
                <div style={{ width:50, height:50, background:`${s.color}18`, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:18 }}>{s.icon}</div>
                <div style={{ fontWeight:800, fontSize:19, color:T.text, marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:14, color:T.textSub, lineHeight:1.7 }}>{s.desc}</div>
                <div style={{ position:"absolute", bottom:18, right:18, width:24, height:24, borderRadius:"50%", background:s.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#FFF", fontSize:12, fontWeight:700 }}>{parseInt(s.num)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ padding:"80px 24px", background:T.bgAlt }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <span style={{ fontSize:12, fontWeight:700, color:BRAND.indigo, letterSpacing:2, textTransform:"uppercase" }}>Fitur Unggulan</span>
            <h2 style={{ fontSize:"clamp(26px,4vw,42px)", fontWeight:800, marginTop:8, letterSpacing:-1 }}>Satu app untuk semua administrasi</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:14 }}>
            {[
              { icon:"🤖", title:"Full AI Generate", desc:"6 AI agent bekerja bersamaan: CP → TP → ATP → Kegiatan → Asesmen", color:BRAND.indigo, tier:"Go" },
              { icon:"📚", title:"Library Kurikulum", desc:"Browse dan fork modul dari guru lain yang sudah dikurasi.", color:BRAND.emerald, tier:"Free" },
              { icon:"📓", title:"Jurnal Harian", desc:"Isi jurnal dalam 60 detik. Absensi siswa dengan swipe cepat.", color:BRAND.amber, tier:"Go" },
              { icon:"📊", title:"Input Nilai", desc:"Nilai per TP. Deskripsi siswa otomatis dari AI.", color:BRAND.red, tier:"Go" },
              { icon:"📋", title:"Bukti PMM", desc:"Paket Bukti Kinerja siap upload ke PMM. 1 klik.", color:BRAND.purple, tier:"Plus" },
              { icon:"📄", title:"Export PDF", desc:"Format A4 standar Kemendikbud, siap cetak.", color:BRAND.indigo, tier:"Go" },
            ].map(f => (
              <div key={f.title} className="hov-card" style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:16, padding:"22px 20px", boxShadow:T.cardShadow }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ width:42, height:42, background:`${f.color}15`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{f.icon}</div>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:f.tier==="Free"?T.bgAlt:f.tier==="Go"?(dark?"rgba(79,70,229,.15)":BRAND.indigoLight):(dark?"rgba(245,158,11,.15)":BRAND.amberLight), color:f.tier==="Free"?T.textSub:f.tier==="Go"?BRAND.indigo:BRAND.amber }}>Plan {f.tier}</span>
                </div>
                <div style={{ fontWeight:700, fontSize:15, color:T.text, marginBottom:6 }}>{f.title}</div>
                <div style={{ fontSize:13, color:T.textSub, lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI DEMO */}
      <div style={{ padding:"80px 24px", background:dark?"#080C14":"#0F172A" }}>
        <div style={{ maxWidth:860, margin:"0 auto", textAlign:"center" }}>
          <h2 style={{ fontSize:"clamp(24px,4vw,42px)", fontWeight:800, color:"#FFF", letterSpacing:-1, marginBottom:14 }}>AI yang paham kurikulum,<br/>bukan hanya teks</h2>
          <p style={{ color:"rgba(255,255,255,.55)", marginBottom:44, fontSize:15 }}>6 agent bekerja secara berurutan, saling passing context</p>
          <div style={{ background:dark?"#111827":"#161B27", borderRadius:20, padding:"26px 28px", border:"1px solid rgba(255,255,255,.07)", textAlign:"left" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:26 }}>
              <div style={{ width:34, height:34, background:`linear-gradient(135deg,${BRAND.indigo},${BRAND.amber})`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🤖</div>
              <div>
                <div style={{ fontWeight:700, color:"#FFF", fontSize:13 }}>AI sedang menyusun modulmu...</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>Matematika Fase D · Kelas 8A · 2×40 menit</div>
              </div>
            </div>
            {AI_STEPS.map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:11 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:s.done?BRAND.emerald:s.active?BRAND.amber:"rgba(255,255,255,.06)", border:`1.5px solid ${s.done?BRAND.emerald:s.active?BRAND.amber:"rgba(255,255,255,.12)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, flexShrink:0 }}>
                  {s.done?"✓":s.active?<span style={{ width:6,height:6,background:BRAND.amber,borderRadius:"50%",animation:"pulse 1s infinite" }} />:""}
                </div>
                <span style={{ fontSize:13, color:s.done?"#FFF":s.active?BRAND.amber:"rgba(255,255,255,.28)", fontWeight:s.active?600:400 }}>{s.label}</span>
                {(s.done||s.active) && <span style={{ fontSize:11, color:s.done?BRAND.emerald:BRAND.amber, marginLeft:"auto" }}>{s.done?"selesai":"memproses..."}</span>}
              </div>
            ))}
            <div style={{ marginTop:18, background:"rgba(255,255,255,.06)", borderRadius:99, height:5, overflow:"hidden" }}>
              <div style={{ width:"50%", height:"100%", background:`linear-gradient(90deg,${BRAND.indigo},${BRAND.amber})`, borderRadius:99 }} />
            </div>
            <div style={{ marginTop:6, fontSize:11, color:"rgba(255,255,255,.25)", textAlign:"right" }}>Biasanya selesai dalam 30–60 detik</div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      {/* Ref: modulajar-spec-v3.jsx — SSOT Pricing: free | pro (monthly/6mo/annual) | sekolah (tiered per-guru) */}
      <div id="harga" style={{ padding:"96px 24px", background:T.bg }}>
        <div style={{ maxWidth:1020, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <span style={{ fontSize:12, fontWeight:700, color:BRAND.indigo, letterSpacing:2, textTransform:"uppercase" }}>Harga</span>
            <h2 style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:800, marginTop:8, letterSpacing:-1 }}>Harga kopi seminggu, hemat 10+ jam</h2>
            <p style={{ color:T.textSub, marginTop:6, fontSize:14 }}>PPN 11% sudah termasuk di semua harga</p>
            {/* Billing cycle toggle — applies to Pro */}
            <div style={{ display:"inline-flex", background:T.bgAlt, borderRadius:10, padding:4, marginTop:18, gap:2, border:`1px solid ${T.border}` }}>
              {["monthly","6mo","yearly"].map(b => (
                <button key={b} onClick={()=>setBilling(b)} style={{ padding:"7px 16px", borderRadius:8, border:"none", background:billing===b?T.surface:"transparent", boxShadow:billing===b?T.cardShadow:"none", fontWeight:600, fontSize:12, cursor:"pointer", color:T.text, fontFamily:"inherit", transition:"all .2s" }}>
                  {b==="monthly"?"Bulanan":b==="6mo"?"6 Bulan":<>Tahunan <span style={{ fontSize:10, color:BRAND.emerald, fontWeight:700 }}>Hemat 2 bln</span></>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(272px,1fr))", gap:16, alignItems:"stretch" }}>
            {PLANS.map(plan => {
              const isPro = plan.key === "pro";
              const isSchool = plan.key === "school";
              const isFeatured = isPro;
              // Price display per billing cycle
              const priceDisplay = isSchool ? null : (() => {
                if (plan.price === 0) return { main:"Gratis", sub:null, alt:null };
                const p = billing==="monthly" ? plan.price : billing==="6mo" ? (plan.price6mo ?? plan.price) : (plan.priceYearly ?? plan.price);
                const sub = billing==="monthly" ? null : billing==="6mo" ? `/ 6 bulan` : `/ tahun`;
                const alt = billing==="monthly" && plan.price6mo
                  ? <>atau <strong>Rp {plan.price6mo.toLocaleString("id-ID")}</strong>/6bln · <strong>Rp {(plan.priceYearly ?? 0).toLocaleString("id-ID")}</strong>/thn</>
                  : billing==="6mo"
                  ? <>atau <strong>Rp {plan.price.toLocaleString("id-ID")}</strong>/bln · <strong>Rp {(plan.priceYearly ?? 0).toLocaleString("id-ID")}</strong>/thn</>
                  : billing==="yearly" && plan.price6mo
                  ? <>Rp {plan.price6mo.toLocaleString("id-ID")}/6bln · Rp {plan.price.toLocaleString("id-ID")}/bln</>
                  : null;
                return { main:`Rp ${p.toLocaleString("id-ID")}`, sub, alt };
              })();
              return (
              <div key={plan.key} className="hov-card" style={{
                background: isFeatured ? BRAND.indigo : T.surface,
                border: `2px solid ${isFeatured ? BRAND.indigo : isSchool ? BRAND.emerald : T.border}`,
                borderRadius:20, padding:"26px 22px", position:"relative", overflow:"hidden",
                boxShadow: isFeatured ? "0 12px 40px rgba(79,70,229,.35)" : T.cardShadow,
              }}>
                {plan.badge && <div style={{ position:"absolute", top:14, right:14, background:BRAND.amber, color:"#1A1200", fontSize:10, fontWeight:700, padding:"2px 10px", borderRadius:99 }}>{plan.badge}</div>}
                <div style={{ marginBottom:18 }}>
                  <div style={{ fontWeight:800, fontSize:19, color:isFeatured?"#FFF":T.text }}>{plan.label}</div>
                  <div style={{ fontSize:13, color:isFeatured?"rgba(255,255,255,.65)":T.textSub, marginTop:3 }}>{plan.desc}</div>
                </div>
                {/* Price block */}
                <div style={{ marginBottom:22 }}>
                  {!isSchool && (
                    <span style={{ fontSize:isFeatured?28:34, fontWeight:900, color:isFeatured?"#FFF":BRAND.indigo }}>
                      {priceDisplay?.main}
                    </span>
                  )}
                  {!isSchool && priceDisplay?.sub && <span style={{ fontSize:14, color:isFeatured?"rgba(255,255,255,.55)":T.textMuted }}>{priceDisplay.sub}</span>}
                  {!isSchool && priceDisplay?.alt && <div style={{ fontSize:11, color:isFeatured?"rgba(255,255,255,.5)":T.textMuted, marginTop:4, lineHeight:1.5 }}>{priceDisplay.alt}</div>}
                  {/* School tier table */}
                  {isSchool && plan.tiers && (
                    <div style={{ fontSize:12 }}>
                      {plan.tiers.map(tier => (
                        <div key={tier.label} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:`1px solid ${dark?"rgba(255,255,255,.08)":"#E2E8F0"}`, color:isFeatured?"rgba(255,255,255,.8)":T.text }}>
                          <span>{tier.label}</span>
                          <span style={{ fontWeight:700 }}>Rp {tier.price.toLocaleString("id-ID")}<span style={{ fontWeight:400, opacity:.7 }}>/{tier.per}</span></span>
                        </div>
                      ))}
                      <div style={{ fontSize:11, color:isFeatured?"rgba(255,255,255,.5)":T.textMuted, marginTop:6 }}>Minimum {plan.minGuru} guru · Annual billing</div>
                    </div>
                  )}
                </div>
                {plan.anchor && (
                  <div style={{ fontSize:11, color:isFeatured?"rgba(255,255,255,.7)":BRAND.indigo, background:isFeatured?"rgba(255,255,255,.1)":BRAND.indigoLight, padding:"5px 10px", borderRadius:7, marginBottom:16 }}>
                    {plan.anchor}
                  </div>
                )}
                <div style={{ marginBottom:22 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display:"flex", gap:8, marginBottom:7 }}>
                      <span style={{ color:isFeatured?BRAND.amber:BRAND.emerald, fontWeight:700, fontSize:13, flexShrink:0 }}>✓</span>
                      <span style={{ fontSize:13, color:isFeatured?"rgba(255,255,255,.85)":T.text }}>{f}</span>
                    </div>
                  ))}
                  {plan.locked.map(f => (
                    <div key={f} style={{ display:"flex", gap:8, marginBottom:7 }}>
                      <span style={{ color:isFeatured?"rgba(255,255,255,.2)":T.textMuted, fontSize:13, flexShrink:0 }}>–</span>
                      <span style={{ fontSize:13, color:isFeatured?"rgba(255,255,255,.3)":T.textMuted }}>{f}</span>
                    </div>
                  ))}
                  {plan.limitsNote && (
                    <div style={{ fontSize:11, color:BRAND.red, background:BRAND.redLight, padding:"5px 8px", borderRadius:6, marginTop:6 }}>
                      ⚠️ {plan.limitsNote}
                    </div>
                  )}
                </div>
                <button className="hov-btn" style={{
                  width:"100%", padding:13, borderRadius:12,
                  background:plan.key==="school"?BRAND.emerald:isFeatured?BRAND.amber:(dark?"rgba(79,70,229,.12)":BRAND.indigoLight),
                  color:plan.key==="school"?"#FFF":isFeatured?"#1A1200":BRAND.indigo,
                  border:`1.5px solid ${plan.key==="school"?BRAND.emerald:isFeatured?BRAND.amber:BRAND.indigo+"44"}`,
                  fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit"
                }}>
                  {plan.cta}
                </button>
              </div>
              );
            })}
          </div>

          <div style={{ textAlign:"center", marginTop:20, padding:"12px 20px", background:dark?"rgba(245,158,11,.08)":BRAND.amberLight, borderRadius:12, border:`1px solid ${BRAND.amber}33` }}>
            <span style={{ fontSize:13, color:T.text }}>💡 Habis kuota? <strong>Top-up Rp 10.000 = +3 modul AI</strong> — tanpa ganti plan</span>
          </div>
        </div>
      </div>

      {/* COMING SOON */}

          <div style={{ textAlign:"center", marginTop:20, padding:"12px 20px", background:dark?"rgba(245,158,11,.08)":BRAND.amberLight, borderRadius:12, border:`1px solid ${BRAND.amber}33` }}>
            <span style={{ fontSize:13, color:T.text }}>💡 Habis quota? <strong>Top-up Rp 5.000 = +3 modul Full AI</strong> — tanpa ganti plan</span>
          </div>
        </div>
      </div>

      {/* COMING SOON */}
      <div style={{ padding:"72px 24px", background:T.bgAlt, borderTop:`1px solid ${T.border}` }}>
        <div style={{ maxWidth:860, margin:"0 auto", textAlign:"center" }}>
          <span style={{ fontSize:12, fontWeight:700, color:BRAND.indigo, letterSpacing:2, textTransform:"uppercase" }}>Segera Hadir</span>
          <h2 style={{ fontSize:"clamp(24px,3.5vw,38px)", fontWeight:800, marginTop:8, letterSpacing:-1, marginBottom:32 }}>Modulajar terus berkembang</h2>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" }}>
            {COMING.map(item => (
              <div key={item.text} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:T.surface, borderRadius:10, border:`1.5px solid ${T.border}`, boxShadow:T.cardShadow }}>
                <span style={{ fontSize:18 }}>{item.icon}</span>
                <span style={{ fontSize:14, fontWeight:600, color:T.text }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" style={{ padding:"96px 24px", background:T.bg }}>
        <div style={{ maxWidth:740, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <span style={{ fontSize:12, fontWeight:700, color:BRAND.indigo, letterSpacing:2, textTransform:"uppercase" }}>FAQ</span>
            <h2 style={{ fontSize:"clamp(26px,4vw,40px)", fontWeight:800, marginTop:8, letterSpacing:-1 }}>Pertanyaan yang sering ditanya</h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {FAQS.map((faq,i) => (
              <div key={i} style={{ border:`1.5px solid ${openFaq===i?BRAND.indigo:T.border}`, borderRadius:14, overflow:"hidden", transition:"border-color .2s" }}>
                <button className="hov-faq" onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{ width:"100%", padding:"17px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", background:openFaq===i?(dark?"rgba(79,70,229,.12)":BRAND.indigoLight):T.surface, border:"none", cursor:"pointer", fontFamily:"inherit", textAlign:"left", transition:"background .2s" }}>
                  <span style={{ fontWeight:700, fontSize:14, color:T.text, paddingRight:12 }}>{faq.q}</span>
                  <span style={{ fontSize:22, color:BRAND.indigo, flexShrink:0, transform:openFaq===i?"rotate(45deg)":"none", transition:"transform .2s", lineHeight:1 }}>+</span>
                </button>
                {openFaq===i && <div style={{ padding:"0 20px 18px", fontSize:14, color:T.textSub, lineHeight:1.8, background:T.surface }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ padding:"96px 24px", background:dark?"#0D1117":`linear-gradient(135deg,${BRAND.indigoDark},#6D28D9)`, textAlign:"center", position:"relative", overflow:"hidden", borderTop:dark?`1px solid ${BRAND.indigo}33`:"none" }}>
        {dark && <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at center, rgba(79,70,229,.15) 0%, transparent 70%)`, pointerEvents:"none" }} />}
        <div style={{ position:"relative" }}>
          <div className="float" style={{ fontSize:52, marginBottom:18 }}>📚</div>
          <h2 style={{ fontSize:"clamp(28px,4.5vw,52px)", fontWeight:900, color:"#FFF", letterSpacing:-1.5, marginBottom:14 }}>Mulai mengajar lebih<br/>cerdas hari ini</h2>
          <p style={{ color:"rgba(255,255,255,.6)", fontSize:16, marginBottom:32 }}>Gratis untuk memulai. Tidak perlu kartu kredit.</p>
          <button className="hov-btn" style={{ padding:"16px 48px", background:BRAND.amber, color:"#1A1200", borderRadius:14, fontSize:18, fontWeight:800, border:"none", cursor:"pointer", boxShadow:"0 8px 40px rgba(245,158,11,.4)" }}>Daftar Gratis Sekarang ✨</button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background:dark?"#080C14":"#0F172A", padding:"44px 24px 28px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:28, marginBottom:36 }}>
            <div style={{ maxWidth:240 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div style={{ width:26, height:26, background:`linear-gradient(135deg,${BRAND.indigo},${BRAND.amber})`, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>📚</div>
                <span style={{ fontWeight:800, fontSize:15, color:"#FFF" }}>modulajar</span>
              </div>
              <p style={{ fontSize:13, color:"rgba(255,255,255,.35)", lineHeight:1.7 }}>Platform AI untuk guru Indonesia. Buat modul ajar, isi jurnal, dan siapkan bukti PMM dari satu tempat.</p>
            </div>
            <div style={{ display:"flex", gap:44, flexWrap:"wrap" }}>
              {[{ title:"Produk", links:["Fitur","Harga","Library","Tentang"] },{ title:"Legal", links:["Syarat","Privasi","Refund","Cookie"] },{ title:"Bantuan", links:["Help Center","Kontak","Status"] }].map(col => (
                <div key={col.title}>
                  <div style={{ fontWeight:700, color:"#FFF", fontSize:13, marginBottom:10 }}>{col.title}</div>
                  {col.links.map(l => <div key={l} style={{ fontSize:13, color:"rgba(255,255,255,.3)", marginBottom:7, cursor:"pointer" }}>{l}</div>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,.07)", paddingTop:18, display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            <span style={{ fontSize:12, color:"rgba(255,255,255,.2)" }}>© 2025 Modulajar. Semua harga termasuk PPN 11%.</span>
            <span style={{ fontSize:12, color:"rgba(255,255,255,.2)" }}>Dibuat dengan ❤️ untuk guru Indonesia 🇮🇩</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
