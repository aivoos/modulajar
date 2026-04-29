import { useState } from "react";

// ─── SHARED THEME SYSTEM (sama persis dengan marketing + admin) ──────────────
const BRAND = {
  indigo:"#4F46E5", indigoDark:"#4338CA", indigoLight:"#EEF2FF",
  amber:"#F59E0B", amberLight:"#FFFBEB",
  emerald:"#10B981", emeraldLight:"#ECFDF5",
  red:"#EF4444", redLight:"#FEF2F2",
  purple:"#8B5CF6", purpleLight:"#F5F3FF",
};

const LIGHT = {
  bg:"#F8FAFC", bgAlt:"#F1F5F9",
  surface:"#FFFFFF", surfaceHover:"#F8FAFC",
  border:"#E2E8F0", borderStrong:"#CBD5E1",
  text:"#0F172A", textSub:"#475569", textMuted:"#94A3B8",
  sidebar:"#FFFFFF", sidebarBorder:"#E2E8F0",
  topbar:"#FFFFFF", topbarBorder:"#E2E8F0",
  cardShadow:"0 1px 4px rgba(0,0,0,0.06)",
  inputBg:"#F8FAFC",
};
const DARK = {
  bg:"#0D1117", bgAlt:"#111827",
  surface:"#161B27", surfaceHover:"#1A2030",
  border:"#21293A", borderStrong:"#2D3B4E",
  text:"#F1F5F9", textSub:"#94A3B8", textMuted:"#475569",
  sidebar:"#0A0E17", sidebarBorder:"#1A2030",
  topbar:"#0A0E17", topbarBorder:"#1A2030",
  cardShadow:"0 1px 4px rgba(0,0,0,0.4)",
  inputBg:"#111827",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
// Ref: modulajar-spec-v3.jsx — SSOT: plan = free | pro | school | mode = full_ai | curated | scratch
const MODULES = [
  { id:1, title:"Persamaan Linear Satu Variabel", subject:"Matematika", phase:"D", grade:"8", cls:"8A", status:"published", mode:"full_ai", updated:"2 jam lalu" },
  { id:2, title:"Ekosistem dan Rantai Makanan", subject:"IPA", phase:"D", grade:"7", cls:"7B", status:"draft", mode:"scratch", updated:"Kemarin" },
  { id:3, title:"Teks Eksposisi dalam Kehidupan", subject:"Bahasa Indonesia", phase:"D", grade:"8", cls:"8A", status:"published", mode:"curated", updated:"3 hari lalu" },
  { id:4, title:"Hak dan Kewajiban Warga Negara", subject:"PPKN", phase:"D", grade:"9", cls:"9C", status:"draft", mode:"full_ai", updated:"1 minggu lalu" },
  { id:5, title:"Gerak Lurus Beraturan (GLB)", subject:"IPA", phase:"E", grade:"10", cls:"10A", status:"archived", mode:"scratch", updated:"2 minggu lalu" },
];

const JOURNALS = [
  { cls:"8A", subject:"Matematika", topic:"Persamaan Linear — Langkah 1", date:"Hari ini", hadir:32, absent:2 },
  { cls:"7B", subject:"IPA", topic:"Rantai Makanan di Hutan Tropis", date:"Kemarin", hadir:30, absent:0 },
  { cls:"9C", subject:"PPKN", topic:"Diskusi Hak Warga Negara", date:"Senin", hadir:28, absent:3 },
];

const CLASSES = [
  { name:"8A", subject:"Matematika", students:34, phase:"D", day:"Senin, Rabu", time:"08.00–09.20" },
  { name:"7B", subject:"IPA", students:30, phase:"D", day:"Selasa, Kamis", time:"10.00–11.20" },
  { name:"9C", subject:"PPKN", students:31, phase:"E", day:"Rabu", time:"13.00–14.20" },
];

const SUBJ_COLOR = { "Matematika":BRAND.indigo, "IPA":BRAND.emerald, "IPS":BRAND.amber, "Bahasa Indonesia":BRAND.purple, "PPKN":BRAND.red };
const sc = (s) => SUBJ_COLOR[s] || BRAND.indigo;

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────
const StatusBadge = ({ status, T }) => {
  const m = { published:{ bg:BRAND.emeraldLight, c:BRAND.emerald, label:"✓ Published" }, draft:{ bg:BRAND.amberLight, c:BRAND.amber, label:"Draft" }, archived:{ bg:"#F1F5F9", c:"#64748B", label:"Archived" } };
  const s = m[status] || m.draft;
  return <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:s.bg, color:s.c }}>{s.label}</span>;
};

const ModeBadge = ({ mode, T, dark }) => {
  const m = { full_ai:{ l:"🤖 Full AI", c:BRAND.indigo, bg:dark?"rgba(79,70,229,.15)":BRAND.indigoLight }, curated:{ l:"📚 Kurator", c:BRAND.purple, bg:dark?"rgba(139,92,246,.12)":BRAND.purpleLight }, scratch:{ l:"✏️ Scratch", c:T.textSub, bg:T.bgAlt } };
  const v = m[mode] || m.scratch;
  return <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:99, background:v.bg, color:v.c }}>{v.l}</span>;
};

const NavItem = ({ icon, label, active, badge, onClick, T, dark }) => (
  <button onClick={onClick} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, border:"none", background:active?(dark?"rgba(79,70,229,.18)":BRAND.indigoLight):"transparent", color:active?BRAND.indigo:T.textSub, fontWeight:active?700:500, fontSize:13, cursor:"pointer", fontFamily:"inherit", textAlign:"left", transition:"all .15s" }}>
  <span style={{ fontSize:17 }}>{icon}</span>
  <span style={{ flex:1 }}>{label}</span>
  {badge && <span style={{ fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:99, background:BRAND.red, color:"#FFF" }}>{badge}</span>}
</button>
);

const StatCard = ({ icon, value, label, sub, color, T, dark }) => (
  <div style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:14, padding:"18px", display:"flex", gap:12, alignItems:"flex-start", boxShadow:T.cardShadow }}>
    <div style={{ width:42, height:42, background:`${color}18`, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
    <div>
      <div style={{ fontSize:24, fontWeight:800, color:color, letterSpacing:-.5 }}>{value}</div>
      <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{sub}</div>}
    </div>
  </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const [nav, setNav] = useState("dashboard");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [genStep, setGenStep] = useState(0);

  const T = dark ? DARK : LIGHT;

  const filtered = filter==="all" ? MODULES : MODULES.filter(m=>m.status===filter);

  const handleGen = () => { setShowModal(false); setGenStep(1); setTimeout(()=>setGenStep(2),3000); };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif", background:T.bg, color:T.text, overflow:"hidden", transition:"background .25s, color .25s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .sc{overflow-y:auto;}
        .sc::-webkit-scrollbar{width:4px;}
        .sc::-webkit-scrollbar-thumb{background:${T.border};border-radius:99px;}
        .hov-row:hover{background:${T.surfaceHover}!important;}
        .hov-card:hover{border-color:${BRAND.indigo}!important;box-shadow:0 4px 20px rgba(79,70,229,.1)!important;}
        .hov-card{transition:border-color .15s,box-shadow .15s;}
        .hov-btn:hover{opacity:.88;}
        .hov-btn{transition:opacity .15s;cursor:pointer;}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width:218, background:T.sidebar, borderRight:`1px solid ${T.sidebarBorder}`, display:"flex", flexDirection:"column", flexShrink:0, transition:"background .25s, border-color .25s" }}>
        {/* Logo */}
        <div style={{ padding:"18px 14px 14px", borderBottom:`1px solid ${T.sidebarBorder}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, background:`linear-gradient(135deg,${BRAND.indigo},${BRAND.amber})`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📚</div>
            <span style={{ fontWeight:800, fontSize:15, letterSpacing:-.5, color:T.text }}>modulajar</span>
          </div>
        </div>

        {/* Nav */}
        <div className="sc" style={{ flex:1, padding:"10px 8px" }}>
          {[
            { id:"dashboard", icon:"🏠", label:"Dashboard" },
            { id:"modules", icon:"📄", label:"Modul Ajar" },
            { id:"library", icon:"📚", label:"Library" },
            { id:"classes", icon:"🏫", label:"Kelas Saya" },
            { id:"journals", icon:"📓", label:"Jurnal", badge:"1" },
            { id:"grades", icon:"📊", label:"Nilai Siswa" },
            { id:"pmm", icon:"🏅", label:"Bukti PMM" },
          ].map(item => <NavItem key={item.id} {...item} active={nav===item.id} onClick={()=>setNav(item.id)} T={T} dark={dark} />)}

          <div style={{ padding:"12px 12px 4px", fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1.2, textTransform:"uppercase", marginTop:6 }}>Akun</div>
          {[
            { id:"billing", icon:"💳", label:"Langganan" },
            { id:"settings", icon:"⚙️", label:"Pengaturan" },
          ].map(item => <NavItem key={item.id} {...item} active={nav===item.id} onClick={()=>setNav(item.id)} T={T} dark={dark} />)}
        </div>

        {/* Quota bar — Ref: modulajar-spec-v3.jsx — plan = pro (not go), 30×/bulan */}
        <div style={{ padding:"10px 10px", borderTop:`1px solid ${T.sidebarBorder}` }}>
          <div style={{ background:dark?"rgba(79,70,229,.12)":BRAND.indigoLight, borderRadius:10, padding:"10px 12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:12, fontWeight:700, color:BRAND.indigo }}>Plan Pro</span>
              <span style={{ fontSize:10, color:BRAND.indigo, fontWeight:600 }}>7/30 slot</span>
            </div>
            <div style={{ background:dark?"rgba(79,70,229,.2)":"rgba(79,70,229,.15)", borderRadius:99, height:5 }}>
              <div style={{ width:"23%", height:"100%", background:BRAND.indigo, borderRadius:99 }} />
            </div>
            <div style={{ fontSize:11, color:T.textSub, marginTop:5 }}>23 AI generate tersisa bulan ini</div>
          </div>
        </div>

        {/* User */}
        <div style={{ padding:"10px 12px", borderTop:`1px solid ${T.sidebarBorder}`, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, background:`linear-gradient(135deg,${BRAND.indigo},${BRAND.purple})`, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#FFF", fontSize:13, fontWeight:700, flexShrink:0 }}>S</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>Bu Sari</div>
            <div style={{ fontSize:11, color:T.textMuted }}>SMA Negeri 1 Bandung</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ background:T.topbar, borderBottom:`1px solid ${T.topbarBorder}`, padding:"0 24px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, transition:"background .25s" }}>
          <span style={{ fontSize:15, fontWeight:700, color:T.text }}>{nav.charAt(0).toUpperCase()+nav.slice(1)}</span>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* Dark mode toggle */}
            <button onClick={()=>setDark(d=>!d)} style={{ width:34, height:34, borderRadius:9, background:T.bgAlt, border:`1px solid ${T.border}`, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {dark?"☀️":"🌙"}
            </button>
            {/* Notif */}
            <button style={{ width:34, height:34, borderRadius:9, background:T.bgAlt, border:`1px solid ${T.border}`, cursor:"pointer", position:"relative", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>
              🔔
              <span style={{ position:"absolute", top:5, right:5, width:7, height:7, background:BRAND.red, borderRadius:"50%", border:`2px solid ${T.topbar}` }} />
            </button>
            <button className="hov-btn" onClick={()=>setShowModal(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px", background:BRAND.indigo, color:"#FFF", borderRadius:9, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>
              + Buat Modul
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="sc" style={{ flex:1, padding:"22px 24px", overflowY:"auto" }}>

          {/* DASHBOARD */}
          {nav==="dashboard" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              {/* Banner */}
              <div style={{ background:dark?"rgba(245,158,11,.08)":BRAND.amberLight, border:`1.5px solid rgba(245,158,11,.25)`, borderRadius:12, padding:"11px 16px", marginBottom:18, display:"flex", gap:10, alignItems:"center" }}>
                <span>🔄</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:BRAND.amber }}>Kurikulum Merdeka 2025 tersedia </span>
                  <span style={{ fontSize:13, color:T.textSub }}>— 2 modul perlu di-review</span>
                </div>
                <button style={{ padding:"5px 12px", background:BRAND.amber, color:"#1A1200", borderRadius:7, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Review →</button>
              </div>

              {/* Greeting */}
              <h1 style={{ fontSize:22, fontWeight:800, color:T.text, letterSpacing:-.5, marginBottom:3 }}>Selamat pagi, Bu Sari! ☀️</h1>
              <p style={{ color:T.textSub, fontSize:13, marginBottom:22 }}>Kurikulum Merdeka Fase D · Semester Ganjil 2025/2026</p>

              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:12, marginBottom:22 }}>
                <StatCard icon="📄" value="12" label="Modul Selesai" sub="3 draft aktif" color={BRAND.indigo} T={T} dark={dark} />
                <StatCard icon="📓" value="23" label="Jurnal Diisi" sub="Bulan ini" color={BRAND.emerald} T={T} dark={dark} />
                <StatCard icon="📊" value="94%" label="Kehadiran" sub="3 kelas" color={BRAND.amber} T={T} dark={dark} />
                <StatCard icon="🏅" value="2" label="Update PMM" sub="Deadline akhir bulan" color={BRAND.red} T={T} dark={dark} />
              </div>

              {/* Quick actions */}
              <h3 style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:10 }}>Aksi Cepat</h3>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:22 }}>
                {[
                  { icon:"🤖", label:"Full AI Generate", sub:"Pakai 1 slot AI", onClick:()=>setShowModal(true), color:BRAND.indigo },
                  { icon:"📓", label:"Isi Jurnal Hari Ini", sub:"8A belum diisi", onClick:()=>setNav("journals"), color:BRAND.emerald },
                  { icon:"📊", label:"Input Nilai 8A", sub:"Ulangan kemarin", onClick:()=>setNav("grades"), color:BRAND.amber },
                  { icon:"📋", label:"Paket Bukti PMM", sub:"Semester ini", onClick:()=>setNav("pmm"), color:BRAND.purple },
                ].map(a => (
                  <button key={a.label} className="hov-card" onClick={a.onClick} style={{ flex:"1 1 150px", display:"flex", gap:10, alignItems:"center", padding:"12px 14px", background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:12, cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxShadow:T.cardShadow }}>
                    <div style={{ width:36, height:36, background:`${a.color}15`, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{a.icon}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{a.label}</div>
                      <div style={{ fontSize:11, color:T.textMuted }}>{a.sub}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Recent modules */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:T.text }}>Modul Terbaru</h3>
                <button onClick={()=>setNav("modules")} style={{ fontSize:13, color:BRAND.indigo, fontWeight:600, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Lihat semua →</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:22 }}>
                {MODULES.slice(0,3).map(m => (
                  <div key={m.id} className="hov-card" style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:12, padding:"13px 16px", display:"flex", alignItems:"center", gap:12, boxShadow:T.cardShadow }}>
                    <div style={{ width:36, height:36, background:`${sc(m.subject)}12`, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>📄</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.title}</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{m.subject} · Kelas {m.cls} · {m.updated}</div>
                    </div>
                    <StatusBadge status={m.status} T={T} />
                  </div>
                ))}
              </div>

              {/* Today schedule */}
              <h3 style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:10 }}>Jadwal Hari Ini</h3>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {[{ time:"08.00", cls:"8A", subject:"Matematika", st:"done" },{ time:"10.00", cls:"7B", subject:"IPA", st:"ongoing" },{ time:"13.00", cls:"9C", subject:"PPKN", st:"upcoming" }].map(s => (
                  <div key={s.cls} style={{ flex:"1 1 140px", background:T.surface, border:`1.5px solid ${s.st==="ongoing"?BRAND.amber:T.border}`, borderRadius:12, padding:"12px 14px", boxShadow:T.cardShadow }}>
                    <div style={{ fontSize:11, fontWeight:600, color:T.textMuted }}>{s.time} WIB</div>
                    <div style={{ fontWeight:800, fontSize:15, color:T.text, marginTop:1 }}>Kelas {s.cls}</div>
                    <div style={{ fontSize:13, color:T.textSub }}>{s.subject}</div>
                    <div style={{ marginTop:7 }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99, background:s.st==="done"?(dark?"rgba(16,185,129,.12)":BRAND.emeraldLight):s.st==="ongoing"?(dark?"rgba(245,158,11,.12)":BRAND.amberLight):(dark?"rgba(255,255,255,.05)":T.bgAlt), color:s.st==="done"?BRAND.emerald:s.st==="ongoing"?BRAND.amber:T.textMuted }}>
                        {s.st==="done"?"✓ Selesai":s.st==="ongoing"?"⏳ Berlangsung":"Akan datang"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULES */}
          {nav==="modules" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
                <div>
                  <h2 style={{ fontSize:19, fontWeight:800, color:T.text, letterSpacing:-.5 }}>Modul Ajar</h2>
                  <p style={{ fontSize:12, color:T.textSub }}>{MODULES.length} modul · Semester Ganjil 2025/2026</p>
                </div>
                <button className="hov-btn" onClick={()=>setShowModal(true)} style={{ padding:"9px 16px", background:BRAND.indigo, color:"#FFF", borderRadius:9, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>+ Buat Modul Baru</button>
              </div>

              <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
                {["all","published","draft","archived"].map(f => (
                  <button key={f} onClick={()=>setFilter(f)} style={{ padding:"6px 14px", borderRadius:8, border:`1.5px solid ${filter===f?BRAND.indigo:T.border}`, background:filter===f?(dark?"rgba(79,70,229,.15)":BRAND.indigoLight):T.surface, color:filter===f?BRAND.indigo:T.textSub, fontWeight:filter===f?700:500, fontSize:12, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>
                    {f==="all"?"Semua":f.charAt(0).toUpperCase()+f.slice(1)}
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {filtered.map(m => (
                  <div key={m.id} className="hov-card" style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:12, boxShadow:T.cardShadow }}>
                    <div style={{ width:40, height:40, background:`${sc(m.subject)}12`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:19, flexShrink:0 }}>📄</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{m.title}</div>
                      <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
                        <span style={{ fontSize:12, color:T.textSub }}>{m.subject}</span>
                        <span style={{ color:T.border }}>·</span>
                        <span style={{ fontSize:12, color:T.textSub }}>Fase {m.phase} · Kelas {m.cls}</span>
                        <span style={{ color:T.border }}>·</span>
                        <span style={{ fontSize:12, color:T.textMuted }}>{m.updated}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
                      <ModeBadge mode={m.mode} T={T} dark={dark} />
                      <StatusBadge status={m.status} T={T} />
                      <button style={{ padding:"5px 11px", background:T.bgAlt, color:T.textSub, borderRadius:7, border:`1px solid ${T.border}`, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Edit</button>
                      {m.status!=="archived" && <button style={{ padding:"5px 11px", background:dark?"rgba(79,70,229,.12)":BRAND.indigoLight, color:BRAND.indigo, borderRadius:7, border:"none", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>📥 PDF</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JOURNALS */}
          {nav==="journals" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div>
                  <h2 style={{ fontSize:19, fontWeight:800, color:T.text, letterSpacing:-.5 }}>Jurnal Mengajar</h2>
                  <p style={{ fontSize:12, color:T.textSub }}>Rekam aktivitas mengajar harian</p>
                </div>
                <button style={{ padding:"9px 16px", background:BRAND.emerald, color:"#FFF", borderRadius:9, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>+ Isi Jurnal Baru</button>
              </div>
              <div style={{ background:dark?"rgba(245,158,11,.08)":BRAND.amberLight, border:`1.5px solid rgba(245,158,11,.25)`, borderRadius:11, padding:"12px 16px", marginBottom:18, display:"flex", gap:10, alignItems:"center" }}>
                <span>⚠️</span>
                <span style={{ fontSize:13, color:T.text }}>Kelas <strong>8A</strong> hari ini belum diisi jurnal.</span>
                <button style={{ color:BRAND.amber, fontWeight:700, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:13, marginLeft:4 }}>Isi sekarang →</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
                {JOURNALS.map((j,i) => (
                  <div key={i} className="hov-card" style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:14, padding:"16px 18px", boxShadow:T.cardShadow }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <div style={{ width:38, height:38, background:`${sc(j.subject)}12`, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>📓</div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14, color:T.text }}>Kelas {j.cls} — {j.subject}</div>
                          <div style={{ fontSize:11, color:T.textMuted }}>{j.date}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize:13, color:T.textSub, marginBottom:10, fontStyle:"italic" }}>"{j.topic}"</div>
                    <div style={{ display:"flex", gap:14 }}>
                      <span style={{ display:"flex", gap:5, alignItems:"center", fontSize:12, color:T.textSub }}><span style={{ width:7, height:7, borderRadius:"50%", background:BRAND.emerald }} />{j.hadir} hadir</span>
                      {j.absent>0 && <span style={{ display:"flex", gap:5, alignItems:"center", fontSize:12, color:T.textSub }}><span style={{ width:7, height:7, borderRadius:"50%", background:BRAND.red }} />{j.absent} tidak hadir</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding:"14px 18px", background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:12, display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:T.cardShadow }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:T.text }}>Rekap Jurnal November 2025</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>23 pertemuan · 3 kelas</div>
                </div>
                <button style={{ padding:"7px 14px", background:dark?"rgba(79,70,229,.12)":BRAND.indigoLight, color:BRAND.indigo, borderRadius:8, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>📥 Export PDF</button>
              </div>
            </div>
          )}

          {/* CLASSES */}
          {nav==="classes" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div>
                  <h2 style={{ fontSize:19, fontWeight:800, color:T.text, letterSpacing:-.5 }}>Kelas Saya</h2>
                  <p style={{ fontSize:12, color:T.textSub }}>Semester Ganjil 2025/2026</p>
                </div>
                <button style={{ padding:"9px 16px", background:BRAND.indigo, color:"#FFF", borderRadius:9, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>+ Tambah Kelas</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:14 }}>
                {CLASSES.map(cl => (
                  <div key={cl.name} className="hov-card" style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:16, overflow:"hidden", boxShadow:T.cardShadow }}>
                    <div style={{ background:sc(cl.subject), padding:"18px 20px", color:"#FFF" }}>
                      <div style={{ fontSize:26, fontWeight:900, letterSpacing:-1 }}>Kelas {cl.name}</div>
                      <div style={{ fontSize:13, opacity:.85, marginTop:1 }}>{cl.subject} · Fase {cl.phase}</div>
                    </div>
                    <div style={{ padding:"14px 18px" }}>
                      <div style={{ fontSize:22, fontWeight:800, color:T.text, marginBottom:2 }}>{cl.students} <span style={{ fontSize:12, color:T.textMuted, fontWeight:500 }}>siswa</span></div>
                      <div style={{ fontSize:12, color:T.textSub, marginBottom:2 }}>📅 {cl.day}</div>
                      <div style={{ fontSize:12, color:T.textSub, marginBottom:12 }}>⏰ {cl.time}</div>
                      <div style={{ display:"flex", gap:7 }}>
                        {[["Siswa",T.bgAlt,T.textSub],["Jurnal",dark?"rgba(79,70,229,.12)":BRAND.indigoLight,BRAND.indigo],["Nilai",dark?"rgba(245,158,11,.1)":BRAND.amberLight,BRAND.amber]].map(([l,bg,c]) => (
                          <button key={l} style={{ flex:1, padding:"7px", background:bg, color:c, borderRadius:7, border:"none", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PMM */}
          {nav==="pmm" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <h2 style={{ fontSize:19, fontWeight:800, color:T.text, letterSpacing:-.5, marginBottom:4 }}>Bukti Kinerja PMM</h2>
              <p style={{ fontSize:12, color:T.textSub, marginBottom:20 }}>Semua dokumen siap upload ke Platform Merdeka Mengajar</p>
              <div style={{ background:`linear-gradient(135deg,${BRAND.indigo},#6D28D9)`, borderRadius:16, padding:"22px", color:"#FFF", marginBottom:18, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, background:"rgba(255,255,255,.05)", borderRadius:"50%" }} />
                <div style={{ fontSize:12, opacity:.7, marginBottom:3 }}>Semester Ganjil 2025/2026</div>
                <h3 style={{ fontSize:20, fontWeight:800, letterSpacing:-.5, marginBottom:3 }}>Paket Bukti Kinerja PMM</h3>
                <p style={{ fontSize:13, opacity:.7, marginBottom:18 }}>Rekap Jurnal + Nilai + Modul + Refleksi AI</p>
                <button style={{ padding:"9px 20px", background:BRAND.amber, color:"#1A1200", borderRadius:9, border:"none", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>📦 Generate Paket ZIP</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:12 }}>
                {[{ icon:"📓", title:"Rekap Jurnal", sub:"23 pertemuan · Nov 2025", ready:true, c:BRAND.emerald },{ icon:"📊", title:"Rekap Nilai", sub:"3 kelas · 2 mapel", ready:true, c:BRAND.amber },{ icon:"📄", title:"Daftar Modul", sub:"12 modul published", ready:true, c:BRAND.indigo },{ icon:"🤔", title:"Refleksi AI", sub:"AI-generated dari jurnal", ready:false, c:BRAND.purple }].map(doc => (
                  <div key={doc.title} style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:13, padding:"16px", boxShadow:T.cardShadow }}>
                    <div style={{ fontSize:28, marginBottom:9 }}>{doc.icon}</div>
                    <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:3 }}>{doc.title}</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:12 }}>{doc.sub}</div>
                    <button style={{ width:"100%", padding:"7px", background:doc.ready?(dark?"rgba(79,70,229,.12)":BRAND.indigoLight):`${doc.c}12`, color:doc.ready?BRAND.indigo:doc.c, borderRadius:7, border:"none", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                      {doc.ready?"📥 Download PDF":"✨ Generate AI"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BILLING */}
          {nav==="billing" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <h2 style={{ fontSize:19, fontWeight:800, color:T.text, letterSpacing:-.5, marginBottom:18 }}>Langganan & Billing</h2>
              <div style={{ background:`linear-gradient(135deg,${BRAND.indigo},${BRAND.indigoDark})`, borderRadius:16, padding:"22px", color:"#FFF", marginBottom:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
                  <div>
                    <div style={{ fontSize:12, opacity:.65, marginBottom:3 }}>Plan aktif</div>
                    {/* Ref: modulajar-spec-v3.jsx — Pro: Rp 99k/mo, Rp 494k/6mo, Rp 790k/thn · Sekolah: tiered per-guru */}
                    <div style={{ fontSize:30, fontWeight:900, letterSpacing:-1 }}>Pro</div>
                    <div style={{ fontSize:13, opacity:.7, marginTop:1 }}>Rp 99.000/bulan · Aktif sampai 31 Des 2026</div>
                  </div>
                  <div style={{ background:"rgba(255,255,255,.1)", borderRadius:10, padding:"12px 16px", textAlign:"right" }}>
                    <div style={{ fontSize:11, opacity:.6 }}>AI Quota bulan ini</div>
                    <div style={{ fontSize:24, fontWeight:800, marginTop:1 }}>7 / 30</div>
                    <div style={{ fontSize:10, opacity:.5 }}>AI generate tersisa</div>
                  </div>
                </div>
                <div style={{ background:"rgba(255,255,255,.15)", borderRadius:99, height:5, marginTop:18 }}>
                  <div style={{ width:"23%", height:"100%", background:BRAND.amber, borderRadius:99 }} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
                <button style={{ padding:"12px", background:dark?"rgba(245,158,11,.08)":BRAND.amberLight, color:BRAND.amber, borderRadius:10, border:`1.5px solid ${BRAND.amber}33`, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>⚡ Top-up +3 AI — Rp 10.000</button>
                <button style={{ padding:"12px", background:dark?"rgba(16,185,129,.08)":BRAND.emeraldLight, color:BRAND.emerald, borderRadius:10, border:`1.5px solid ${BRAND.emerald}33`, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>📦 Paket Bukti PMM</button>
                <button style={{ padding:"12px", background:dark?"rgba(79,70,229,.1)":BRAND.indigoLight, color:BRAND.indigo, borderRadius:10, border:`1.5px solid ${BRAND.indigo}33`, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>📄 Billing History</button>
              </div>
              <h3 style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:10 }}>Riwayat Pembayaran</h3>
              {/* Ref: modulajar-spec-v3.jsx — billing_cycle: monthly | 6mo | yearly */}
              {[{ date:"1 Nov 2025", desc:"Plan Pro — Bulanan", method:"QRIS", amount:"Rp 99.000" },{ date:"1 Okt 2025", desc:"Plan Pro — Bulanan", method:"GoPay", amount:"Rp 99.000" },{ date:"15 Sep 2025", desc:"Top-up AI (+3)", method:"QRIS", amount:"Rp 10.000" }].map((p,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:11, marginBottom:7, flexWrap:"wrap", gap:8, boxShadow:T.cardShadow }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:T.text }}>{p.desc}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>{p.date} · {p.method}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{p.amount}</span>
                    <span style={{ fontSize:10, padding:"2px 7px", borderRadius:99, background:dark?"rgba(16,185,129,.12)":BRAND.emeraldLight, color:BRAND.emerald, fontWeight:700 }}>Lunas</span>
                    <button style={{ padding:"4px 9px", background:T.bgAlt, color:T.textSub, borderRadius:6, border:`1px solid ${T.border}`, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Invoice</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fallback */}
          {!["dashboard","modules","journals","classes","pmm","billing"].includes(nav) && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:280, color:T.textMuted }}>
              <div style={{ fontSize:44, marginBottom:10 }}>🚧</div>
              <div style={{ fontWeight:700, fontSize:15, color:T.text }}>"{nav}" sedang dikembangkan</div>
              <div style={{ fontSize:12, marginTop:4 }}>Tersedia dalam Sprint berikutnya</div>
            </div>
          )}
        </div>
      </div>

      {/* NEW MODAL */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:999, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:16 }} onClick={()=>setShowModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:T.surface, borderRadius:20, padding:"26px", maxWidth:500, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,.25)", border:`1px solid ${T.border}` }}>
            <h3 style={{ fontWeight:800, fontSize:19, color:T.text, marginBottom:4, letterSpacing:-.5 }}>Buat Modul Baru</h3>
            <p style={{ fontSize:13, color:T.textSub, marginBottom:18 }}>Pilih cara membuat modul ajar</p>
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {[
                { icon:"🤖", label:"Full AI Generate", sub:"AI menyusun semua komponen · Pakai 1 slot AI", color:BRAND.indigo, fn:handleGen },
                { icon:"📚", label:"Dari Library", sub:"Browse dan fork modul yang sudah dikurasi", color:BRAND.purple, fn:()=>{ setShowModal(false); setNav("library"); } },
                { icon:"✏️", label:"Scratch + AI Assist", sub:"Tulis sendiri dengan bantuan AI per section", color:T.textSub, fn:()=>setShowModal(false) },
              ].map(m => (
                <button key={m.label} className="hov-card" onClick={m.fn} style={{ display:"flex", gap:12, alignItems:"center", padding:"14px", background:T.bgAlt, border:`1.5px solid ${T.border}`, borderRadius:12, cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
                  <div style={{ width:40, height:40, background:`${m.color}15`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{m.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{m.label}</div>
                    <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>{m.sub}</div>
                  </div>
                  <span style={{ color:T.textMuted, fontSize:18 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GENERATING */}
      {genStep===1 && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:T.surface, borderRadius:22, padding:"32px", maxWidth:420, width:"90%", textAlign:"center", border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:44, marginBottom:14, animation:"float 2s infinite" }}>🤖</div>
            <h3 style={{ fontWeight:800, fontSize:19, color:T.text, marginBottom:7 }}>AI sedang menyusun modulmu...</h3>
            <p style={{ fontSize:13, color:T.textSub, marginBottom:22 }}>Biasanya selesai dalam 30–60 detik</p>
            {[{ l:"Membaca Capaian Pembelajaran", d:true },{ l:"Menyusun Tujuan Pembelajaran", d:true },{ l:"Membuat Alur Pembelajaran", a:true },{ l:"Menyusun Kegiatan", d:false },{ l:"Membuat Asesmen", d:false },{ l:"Validasi Kurikulum", d:false }].map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9, textAlign:"left" }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:s.d?BRAND.emerald:s.a?BRAND.amber:T.bgAlt, border:`1.5px solid ${s.d?BRAND.emerald:s.a?BRAND.amber:T.border}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9 }}>
                  {s.d?"✓":s.a?<span style={{ width:5,height:5,background:BRAND.amber,borderRadius:"50%",animation:"pulse 1s infinite" }} />:""}
                </div>
                <span style={{ fontSize:13, color:s.d?T.text:s.a?BRAND.amber:T.textMuted, fontWeight:s.a?600:400 }}>{s.l}</span>
              </div>
            ))}
            <div style={{ background:T.bgAlt, borderRadius:99, height:4, marginTop:14 }}>
              <div style={{ width:"50%", height:"100%", background:`linear-gradient(90deg,${BRAND.indigo},${BRAND.amber})`, borderRadius:99 }} />
            </div>
          </div>
        </div>
      )}

      {genStep===2 && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:T.surface, borderRadius:22, padding:"32px", maxWidth:380, width:"90%", textAlign:"center", border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🎉</div>
            <h3 style={{ fontWeight:800, fontSize:20, color:T.text, marginBottom:7 }}>Modul siap!</h3>
            <p style={{ fontSize:13, color:T.textSub, marginBottom:22 }}>Persamaan Linear · Fase D · Kelas 8A</p>
            <div style={{ display:"flex", gap:9 }}>
              <button className="hov-btn" onClick={()=>setGenStep(0)} style={{ flex:1, padding:"11px", background:T.bgAlt, color:T.text, borderRadius:9, border:`1px solid ${T.border}`, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Edit Modul</button>
              <button className="hov-btn" onClick={()=>setGenStep(0)} style={{ flex:1, padding:"11px", background:BRAND.indigo, color:"#FFF", borderRadius:9, border:"none", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>📥 Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
