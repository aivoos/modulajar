import { useState } from "react";

// ─── SHARED THEME SYSTEM (konsisten dengan marketing + dashboard) ─────────────
const BRAND = {
  indigo:"#4F46E5", indigoDark:"#4338CA", indigoLight:"#EEF2FF",
  amber:"#F59E0B", amberLight:"#FFFBEB",
  emerald:"#10B981", emeraldLight:"#ECFDF5",
  red:"#EF4444", redLight:"#FEF2F2",
  purple:"#8B5CF6", purpleLight:"#F5F3FF",
  cyan:"#06B6D4",
};

const LIGHT = {
  bg:"#F8FAFC", bgAlt:"#F1F5F9",
  surface:"#FFFFFF", surfaceHover:"#F8FAFC",
  border:"#E2E8F0", borderStrong:"#CBD5E1",
  text:"#0F172A", textSub:"#475569", textMuted:"#94A3B8",
  sidebar:"#FFFFFF", sidebarBorder:"#E2E8F0",
  topbar:"#FFFFFF", topbarBorder:"#E2E8F0",
  cardShadow:"0 1px 4px rgba(0,0,0,0.06)",
  mono:"'DM Mono',monospace",
  codeBlock:"#F1F5F9",
  codeText:"#334155",
};
const DARK = {
  bg:"#0D1117", bgAlt:"#111827",
  surface:"#161B27", surfaceHover:"#1A2030",
  border:"#21293A", borderStrong:"#2D3B4E",
  text:"#F1F5F9", textSub:"#94A3B8", textMuted:"#475569",
  sidebar:"#0A0E17", sidebarBorder:"#1A2030",
  topbar:"#0A0E17", topbarBorder:"#1A2030",
  cardShadow:"0 1px 4px rgba(0,0,0,0.4)",
  mono:"'DM Mono',monospace",
  codeBlock:"#0D1117",
  codeText:"#94A3B8",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const METRICS = [
  { label:"MRR", value:"Rp 3.4 jt", delta:"+Rp 490rb", up:true, icon:"💰", color:BRAND.emerald },
  { label:"Total User", value:"312", delta:"+28 minggu ini", up:true, icon:"👤", color:BRAND.indigo },
  { label:"User Aktif (30hr)", value:"187", delta:"60% dari total", up:true, icon:"⚡", color:BRAND.amber },
  { label:"AI Cost Hari Ini", value:"Rp 124rb", delta:"Normal (< 500rb)", up:true, icon:"🤖", color:BRAND.purple },
  { label:"Conversion", value:"8.3%", delta:"+1.2% vs bulan lalu", up:true, icon:"📈", color:BRAND.cyan },
  { label:"Churn Bulan Ini", value:"3", delta:"-2 vs bulan lalu", up:true, icon:"🔄", color:BRAND.indigo },
];

const USERS = [
  { name:"Bu Sari Dewi", email:"sari@sma1bdg.sch.id", school:"SMA Negeri 1 Bandung", plan:"go", status:"active", modules:12, joined:"2 minggu lalu", ai_used:7 },
  { name:"Pak Ahmad Fauzi", email:"ahmad@gmail.com", school:"SMP Negeri 3 Jakarta", plan:"plus", status:"active", modules:28, joined:"1 bulan lalu", ai_used:-1 },
  { name:"Bu Rini Kusuma", email:"rini@smpn5.sch.id", school:"SMP Negeri 5 Surabaya", plan:"free", status:"active", modules:3, joined:"3 hari lalu", ai_used:0 },
  { name:"Pak Budi Santoso", email:"budi@sman2.sch.id", school:"SMA Negeri 2 Bandung", plan:"go", status:"past_due", modules:8, joined:"3 bulan lalu", ai_used:9 },
  { name:"Bu Dewi Lestari", email:"dewi@gmail.com", school:"SD Negeri 1 Yogyakarta", plan:"free", status:"active", modules:1, joined:"Kemarin", ai_used:0 },
];

const CURATED_MODULES = [
  { title:"Persamaan Linear Satu Variabel", subject:"Matematika", phase:"D", author:"Bu Sari", forks:23, curated:true },
  { title:"Ekosistem dan Biodiversitas", subject:"IPA", phase:"D", author:"Pak Ahmad", forks:18, curated:true },
  { title:"Teks Deskripsi — Pendekatan Kontekstual", subject:"Bahasa Indonesia", phase:"C", author:"Bu Rini", forks:12, curated:false },
  { title:"Hak Asasi Manusia dalam Kehidupan", subject:"PPKN", phase:"D", author:"Pak Budi", forks:9, curated:false },
];

const CV = [
  { name:"Kurikulum 2013", code:"K13", year:2013, status:"deprecated", modules:0 },
  { name:"Kurikulum Merdeka 2022", code:"MERDEKA_2022", year:2022, status:"active", modules:847 },
];

const INIT_FLAGS = [
  { key:"full_ai_mode", enabled:true, desc:"Full AI generate modul — aktif saat launch" },
  { key:"curated_library", enabled:true, desc:"Browse dan fork curated modules — aktif saat launch" },
  { key:"plus_tier", enabled:false, desc:"Plus tier — aktifkan saat Sprint 1 post-launch" },
  { key:"sekolah_tier", enabled:false, desc:"Sekolah tier — aktifkan saat Sprint 3 post-launch" },
  { key:"journal_feature", enabled:false, desc:"Jurnal mengajar harian — Sprint 1" },
  { key:"grade_feature", enabled:false, desc:"Input nilai + deskripsi AI — Sprint 1" },
  { key:"pwa_offline", enabled:false, desc:"Offline mode PWA — Sprint 2" },
  { key:"bukti_pmm", enabled:false, desc:"Paket Bukti Kinerja PMM — Sprint 2" },
  { key:"bank_soal", enabled:false, desc:"Bank Soal AI — Sprint 2" },
];

const WEBHOOKS = [
  { event:"payment.paid", payload:"xendit_id: xnd_abc123", processed:true, time:"2 jam lalu" },
  { event:"payment.paid", payload:"xendit_id: xnd_def456", processed:true, time:"5 jam lalu" },
  { event:"payment.expired", payload:"xendit_id: xnd_ghi789", processed:true, time:"Kemarin" },
  { event:"payment.failed", payload:"xendit_id: xnd_jkl012", processed:false, error:"DB timeout", time:"Kemarin" },
];

const PLAN_C = { free:BRAND.indigo, go:BRAND.indigo, plus:BRAND.amber, sekolah:BRAND.emerald };
const STATUS_C = { active:BRAND.emerald, past_due:BRAND.red, cancelled:BRAND.indigo };

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────
const NavBtn = ({ id, icon, label, active, badge, onClick, T, dark }) => (
  <button onClick={onClick} style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"8px 12px", borderRadius:8, border:"none", background:active?(dark?"rgba(79,70,229,.18)":BRAND.indigoLight):"transparent", color:active?BRAND.indigo:T.textSub, fontWeight:active?700:500, fontSize:12, cursor:"pointer", fontFamily:"inherit", textAlign:"left", transition:"all .15s" }}>
  <span style={{ fontSize:15 }}>{icon}</span>
  <span style={{ flex:1 }}>{label}</span>
  {badge && <span style={{ fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:99, background:BRAND.red, color:"#FFF" }}>{badge}</span>}
</button>
);

const Toggle = ({ enabled, onChange, dark }) => (
  <button onClick={onChange} style={{ width:42, height:22, borderRadius:99, background:enabled?BRAND.indigo:(dark?"#21293A":"#E2E8F0"), border:"none", cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
    <div style={{ position:"absolute", top:2, left:enabled?22:2, width:18, height:18, borderRadius:"50%", background:"#FFF", transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
  </button>
);

const MetricCard = ({ label, value, delta, up, icon, color, T, dark }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"16px", boxShadow:T.cardShadow }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:9 }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99, background:up?(dark?"rgba(16,185,129,.12)":BRAND.emeraldLight):(dark?"rgba(239,68,68,.12)":BRAND.redLight), color:up?BRAND.emerald:BRAND.red }}>{up?"↑":"↓"} {delta}</span>
    </div>
    <div style={{ fontSize:26, fontWeight:800, color:color, letterSpacing:-.5 }}>{value}</div>
    <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>{label}</div>
  </div>
);

const MiniBar = ({ data, color }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:44 }}>
      {data.map((d,i) => <div key={i} style={{ flex:1, background:i===data.length-1?color:`${color}44`, borderRadius:3, height:`${Math.max((d/max)*100,6)}%` }} />)}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminPlatform() {
  const [dark, setDark] = useState(true); // admin defaults dark
  const [nav, setNav] = useState("dashboard");
  const [flags, setFlags] = useState(INIT_FLAGS);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const T = dark ? DARK : LIGHT;

  const filteredUsers = USERS.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const toggleFlag = (key) => setFlags(f => f.map(fl => fl.key===key?{...fl,enabled:!fl.enabled}:fl));

  const signupData = [12,8,15,22,19,28,35,24,18,30,42,28,15,18,22,26,30,35,28,24,32,28,20,18,25,30,28,32,35,38];

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif", background:T.bg, color:T.text, overflow:"hidden", transition:"background .25s, color .25s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .sc{overflow-y:auto;}
        .sc::-webkit-scrollbar{width:4px;}
        .sc::-webkit-scrollbar-thumb{background:${T.border};border-radius:99px;}
        .hov-row:hover{background:${T.surfaceHover}!important;}
        .hov-card:hover{border-color:${BRAND.indigo}!important;}
        .hov-card{transition:border-color .15s;}
        .hov-btn:hover{opacity:.85;}
        .hov-btn{transition:opacity .15s;cursor:pointer;}
        input,pre{font-family:inherit;}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width:208, background:T.sidebar, borderRight:`1px solid ${T.sidebarBorder}`, display:"flex", flexDirection:"column", flexShrink:0, transition:"background .25s, border-color .25s" }}>
        {/* Logo */}
        <div style={{ padding:"16px 14px 13px", borderBottom:`1px solid ${T.sidebarBorder}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, background:`linear-gradient(135deg,${BRAND.indigo},${BRAND.amber})`, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>📚</div>
            <div>
              <div style={{ fontWeight:800, fontSize:13, letterSpacing:-.3, color:T.text }}>modulajar</div>
              <div style={{ fontSize:8, color:BRAND.red, fontWeight:700, letterSpacing:1.2, fontFamily:"'DM Mono',monospace" }}>ADMIN INTERNAL</div>
            </div>
          </div>
        </div>

        <div className="sc" style={{ flex:1, padding:"8px 8px", overflowY:"auto" }}>
          <div style={{ fontSize:8, fontWeight:700, color:T.textMuted, letterSpacing:1.3, textTransform:"uppercase", padding:"8px 12px 3px" }}>Overview</div>
          {[{ id:"dashboard",icon:"📊",label:"Dashboard" },{ id:"analytics",icon:"📈",label:"Analytics" }].map(item => <NavBtn key={item.id} {...item} active={nav===item.id} onClick={()=>setNav(item.id)} T={T} dark={dark} />)}

          <div style={{ fontSize:8, fontWeight:700, color:T.textMuted, letterSpacing:1.3, textTransform:"uppercase", padding:"10px 12px 3px" }}>Produk</div>
          {[{ id:"users",icon:"👥",label:"Users" },{ id:"curated",icon:"📄",label:"Modul Kurator" },{ id:"curriculum",icon:"📋",label:"Kurikulum" }].map(item => <NavBtn key={item.id} {...item} active={nav===item.id} onClick={()=>setNav(item.id)} T={T} dark={dark} />)}

          <div style={{ fontSize:8, fontWeight:700, color:T.textMuted, letterSpacing:1.3, textTransform:"uppercase", padding:"10px 12px 3px" }}>Sistem</div>
          {[{ id:"flags",icon:"🚩",label:"Feature Flags" },{ id:"config",icon:"⚙️",label:"App Config" },{ id:"webhooks",icon:"🔗",label:"Webhook Logs",badge:"1" },{ id:"audit",icon:"📋",label:"Audit Log" }].map(item => <NavBtn key={item.id} {...item} active={nav===item.id} onClick={()=>setNav(item.id)} T={T} dark={dark} />)}
        </div>

        {/* Status */}
        <div style={{ padding:"10px 10px", borderTop:`1px solid ${T.sidebarBorder}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:dark?"rgba(16,185,129,.07)":BRAND.emeraldLight, borderRadius:8, border:`1px solid ${dark?"rgba(16,185,129,.2)":"rgba(16,185,129,.25)"}` }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:BRAND.emerald, animation:"pulse 2s infinite", flexShrink:0 }} />
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:BRAND.emerald }}>Production</div>
              <div style={{ fontSize:10, color:T.textMuted }}>v1.0.3 · All systems OK</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ background:T.topbar, borderBottom:`1px solid ${T.topbarBorder}`, padding:"0 22px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, transition:"background .25s" }}>
          <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{nav.charAt(0).toUpperCase()+nav.slice(1)}</span>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* System status badge */}
            <div style={{ padding:"4px 12px", background:dark?"rgba(16,185,129,.08)":BRAND.emeraldLight, border:`1px solid ${dark?"rgba(16,185,129,.2)":"rgba(16,185,129,.25)"}`, borderRadius:6, fontSize:11, fontWeight:600, color:BRAND.emerald }}>✓ Semua sistem normal</div>
            {/* Dark mode toggle */}
            <button onClick={()=>setDark(d=>!d)} style={{ width:32, height:32, borderRadius:8, background:T.bgAlt, border:`1px solid ${T.border}`, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {dark?"☀️":"🌙"}
            </button>
            {/* Avatar */}
            <div style={{ width:30, height:30, background:`linear-gradient(135deg,${BRAND.red},${BRAND.purple})`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#FFF" }}>A</div>
          </div>
        </div>

        {/* Content */}
        <div className="sc" style={{ flex:1, padding:"18px 22px", overflowY:"auto" }}>

          {/* DASHBOARD */}
          {nav==="dashboard" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              {/* AI alert */}
              <div style={{ background:dark?"rgba(16,185,129,.06)":BRAND.emeraldLight, border:`1px solid ${dark?"rgba(16,185,129,.2)":"rgba(16,185,129,.3)"}`, borderRadius:9, padding:"9px 14px", marginBottom:18, display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:13 }}>✅</span>
                <span style={{ fontSize:12, color:BRAND.emerald }}>AI cost hari ini <strong>Rp 124.000</strong> — dalam batas normal (threshold: Rp 500.000)</span>
              </div>

              {/* Metrics */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:10, marginBottom:18 }}>
                {METRICS.map(m => <MetricCard key={m.label} {...m} T={T} dark={dark} />)}
              </div>

              {/* Charts */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"18px", boxShadow:T.cardShadow }}>
                  <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:4 }}>Signup Harian (30 hari)</div>
                  <div style={{ fontSize:11, color:T.textMuted, marginBottom:14 }}>Total: 312 user terdaftar</div>
                  <MiniBar data={signupData} color={BRAND.indigo} />
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
                    <span style={{ fontSize:10, color:T.textMuted }}>1 Nov</span>
                    <span style={{ fontSize:10, color:T.textMuted }}>Hari ini</span>
                  </div>
                </div>
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"18px", boxShadow:T.cardShadow }}>
                  <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:14 }}>Distribusi Plan</div>
                  {[{ plan:"Free", count:201, pct:64, color:T.textMuted },{ plan:"Go", count:89, pct:29, color:BRAND.indigo },{ plan:"Plus", count:22, pct:7, color:BRAND.amber }].map(p => (
                    <div key={p.plan} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:12, color:T.textSub }}>{p.plan}</span>
                        <span style={{ fontSize:11, color:T.textMuted, fontFamily:T.mono }}>{p.count} ({p.pct}%)</span>
                      </div>
                      <div style={{ background:T.border, borderRadius:99, height:5, overflow:"hidden" }}>
                        <div style={{ width:`${p.pct}%`, height:"100%", background:p.color, borderRadius:99 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"18px", boxShadow:T.cardShadow }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:14 }}>Aktivitas Terbaru</div>
                {[
                  { icon:"👤", text:"Bu Dewi Lestari baru daftar", time:"5 menit lalu", err:false },
                  { icon:"💳", text:"Pak Ahmad bayar Plan Go — Rp 49.000 (QRIS)", time:"23 menit lalu", err:false },
                  { icon:"📄", text:"Bu Sari generate Full AI modul (Matematika Fase D)", time:"1 jam lalu", err:false },
                  { icon:"⚠️", text:"Webhook payment.failed — error DB timeout (xnd_jkl012)", time:"Kemarin", err:true },
                ].map((a,i) => (
                  <div key={i} style={{ display:"flex", gap:10, padding:"9px 0", borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>{a.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:a.err?BRAND.red:T.text }}>{a.text}</div>
                      <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {nav==="analytics" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:T.text, letterSpacing:-.5, marginBottom:4 }}>Analytics</h2>
              <p style={{ fontSize:12, color:T.textSub, marginBottom:18 }}>Key metrics dan conversion funnel</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"18px", boxShadow:T.cardShadow }}>
                  <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:14 }}>Conversion Funnel</div>
                  {[{ label:"Signup", count:312, pct:100, c:T.textMuted },{ label:"Buat modul pertama (Activation)", count:201, pct:64, c:BRAND.indigo },{ label:"Download / klik upgrade", count:89, pct:29, c:BRAND.amber },{ label:"Bayar (Free → Go/Plus)", count:26, pct:8, c:BRAND.emerald }].map(s => (
                    <div key={s.label} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:12, color:T.textSub }}>{s.label}</span>
                        <span style={{ fontSize:11, color:T.textMuted, fontFamily:T.mono }}>{s.count} · {s.pct}%</span>
                      </div>
                      <div style={{ background:T.border, borderRadius:99, height:5, overflow:"hidden" }}>
                        <div style={{ width:`${s.pct}%`, height:"100%", background:s.c, borderRadius:99 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"18px", boxShadow:T.cardShadow }}>
                  <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:14 }}>AI Cost per Job Type</div>
                  {[{ label:"modul_generate", cost:"Rp 16.000", jobs:47, c:BRAND.indigo },{ label:"modul_assist", cost:"Rp 800", jobs:234, c:BRAND.purple },{ label:"deskripsi_nilai", cost:"Rp 2.400", jobs:18, c:BRAND.amber },{ label:"prota_promes", cost:"Rp 8.000", jobs:3, c:BRAND.emerald }].map(j => (
                    <div key={j.label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, padding:"9px 11px", background:T.bgAlt, borderRadius:8 }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:j.c, flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:T.mono, fontSize:10, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{j.label}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>{j.jobs} jobs hari ini</div>
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:j.c, flexShrink:0 }}>{j.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {nav==="users" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
                <div>
                  <h2 style={{ fontSize:17, fontWeight:800, color:T.text, letterSpacing:-.5 }}>User Management</h2>
                  <p style={{ fontSize:11, color:T.textSub }}>312 total · 187 aktif</p>
                </div>
                <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Cari nama atau email..." style={{ padding:"7px 12px", background:T.bgAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:12, width:220, outline:"none" }} />
              </div>
              <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden", boxShadow:T.cardShadow }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${T.border}`, background:T.bgAlt }}>
                      {["User","Plan","Status","Modul","Bergabung","Aksi"].map(h => (
                        <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:.5, whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u,i) => (
                      <tr key={i} className="hov-row" style={{ borderBottom:`1px solid ${T.border}`, cursor:"pointer" }} onClick={()=>setSelectedUser(u)}>
                        <td style={{ padding:"11px 14px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                            <div style={{ width:28, height:28, background:`linear-gradient(135deg,${BRAND.indigo},${BRAND.purple})`, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#FFF", flexShrink:0 }}>{u.name[0]}</div>
                            <div>
                              <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{u.name}</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"11px 14px" }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:`${PLAN_C[u.plan]}18`, color:PLAN_C[u.plan], textTransform:"capitalize" }}>{u.plan}</span>
                        </td>
                        <td style={{ padding:"11px 14px" }}>
                          <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, color:STATUS_C[u.status] }}>
                            <span style={{ width:5, height:5, borderRadius:"50%", background:STATUS_C[u.status] }} />
                            {u.status==="active"?"Aktif":u.status==="past_due"?"Past Due":"Cancelled"}
                          </span>
                        </td>
                        <td style={{ padding:"11px 14px", fontSize:12, color:T.text, fontFamily:T.mono }}>{u.modules}</td>
                        <td style={{ padding:"11px 14px", fontSize:11, color:T.textMuted }}>{u.joined}</td>
                        <td style={{ padding:"11px 14px" }}>
                          <div style={{ display:"flex", gap:5 }}>
                            <button style={{ padding:"3px 9px", background:dark?"rgba(79,70,229,.1)":BRAND.indigoLight, color:BRAND.indigo, borderRadius:5, border:"none", fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Detail</button>
                            {u.status==="past_due" && <button style={{ padding:"3px 9px", background:dark?"rgba(239,68,68,.1)":BRAND.redLight, color:BRAND.red, borderRadius:5, border:"none", fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Override</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CURATED MODULES */}
          {nav==="curated" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:T.text, letterSpacing:-.5, marginBottom:4 }}>Modul Kurator</h2>
              <p style={{ fontSize:12, color:T.textSub, marginBottom:18 }}>Review dan kurasi modul terbaik untuk library publik</p>
              <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                {CURATED_MODULES.map((m,i) => (
                  <div key={i} className="hov-card" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"14px 18px", display:"flex", alignItems:"center", gap:12, boxShadow:T.cardShadow }}>
                    <div style={{ width:38, height:38, background:`${BRAND.indigo}12`, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📄</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{m.title}</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{m.subject} · Fase {m.phase} · {m.author} · {m.forks} fork</div>
                    </div>
                    <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:99, background:m.curated?(dark?"rgba(16,185,129,.12)":BRAND.emeraldLight):(dark?"rgba(255,255,255,.05)":T.bgAlt), color:m.curated?BRAND.emerald:T.textMuted }}>
                        {m.curated?"✓ Dikurasi":"Belum dikurasi"}
                      </span>
                      <button style={{ padding:"5px 12px", background:m.curated?(dark?"rgba(239,68,68,.1)":BRAND.redLight):(dark?"rgba(16,185,129,.1)":BRAND.emeraldLight), color:m.curated?BRAND.red:BRAND.emerald, borderRadius:7, border:"none", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                        {m.curated?"Hapus Kurasi":"+ Kurasi"}
                      </button>
                      <button style={{ padding:"5px 12px", background:dark?"rgba(79,70,229,.1)":BRAND.indigoLight, color:BRAND.indigo, borderRadius:7, border:"none", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Preview</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CURRICULUM */}
          {nav==="curriculum" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div>
                  <h2 style={{ fontSize:17, fontWeight:800, color:T.text, letterSpacing:-.5 }}>Kurikulum Versions</h2>
                  <p style={{ fontSize:12, color:T.textSub }}>Kelola versi kurikulum dan template modul</p>
                </div>
                <button className="hov-btn" style={{ padding:"8px 14px", background:BRAND.indigo, color:"#FFF", borderRadius:8, border:"none", fontSize:12, fontWeight:700, fontFamily:"inherit" }}>+ Tambah Versi</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
                {CV.map((cv,i) => (
                  <div key={i} style={{ background:T.surface, border:`1.5px solid ${cv.status==="active"?BRAND.indigo:T.border}`, borderRadius:13, padding:"16px 18px", display:"flex", alignItems:"center", gap:12, boxShadow:T.cardShadow }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:3 }}>
                        <span style={{ fontWeight:700, fontSize:14, color:T.text }}>{cv.name}</span>
                        <span style={{ fontSize:9, fontFamily:T.mono, color:T.textMuted }}>{cv.code}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99, background:cv.status==="active"?(dark?"rgba(79,70,229,.15)":BRAND.indigoLight):(dark?"rgba(255,255,255,.05)":T.bgAlt), color:cv.status==="active"?BRAND.indigo:T.textMuted }}>
                          {cv.status==="active"?"● Aktif":"Deprecated"}
                        </span>
                      </div>
                      <div style={{ fontSize:11, color:T.textMuted }}>{cv.modules} modul menggunakan versi ini</div>
                    </div>
                    <div style={{ display:"flex", gap:7 }}>
                      <button style={{ padding:"6px 12px", background:dark?"rgba(79,70,229,.1)":BRAND.indigoLight, color:BRAND.indigo, borderRadius:7, border:"none", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Edit Template</button>
                      {cv.status!=="active" && <button className="hov-btn" onClick={()=>setConfirmPublish(true)} style={{ padding:"6px 12px", background:BRAND.indigo, color:"#FFF", borderRadius:7, border:"none", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Publish</button>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"18px", boxShadow:T.cardShadow }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:10 }}>migration_rules — MERDEKA_2022</div>
                <pre style={{ fontSize:10, color:T.codeText, lineHeight:1.8, fontFamily:T.mono, background:T.codeBlock, padding:"12px", borderRadius:8, overflowX:"auto", border:`1px solid ${T.border}` }}>{JSON.stringify({ from_version:"K13", field_map:{ tujuan_pembelajaran_k13:"tujuan_pembelajaran", kegiatan_pembelajaran:"kegiatan_inti" }, new_required:["profil_pelajar_pancasila","capaian_pembelajaran"], deprecated:["kompetensi_dasar","indikator_pencapaian"] }, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* FEATURE FLAGS */}
          {nav==="flags" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:T.text, letterSpacing:-.5, marginBottom:4 }}>Feature Flags</h2>
              <p style={{ fontSize:12, color:T.textSub, marginBottom:14 }}>Toggle fitur tanpa deploy. Perubahan efektif dalam 5 menit (cache TTL).</p>
              <div style={{ background:dark?"rgba(245,158,11,.07)":BRAND.amberLight, border:`1px solid ${dark?"rgba(245,158,11,.2)":"rgba(245,158,11,.3)"}`, borderRadius:9, padding:"9px 14px", marginBottom:16 }}>
                <span style={{ fontSize:12, color:BRAND.amber }}>⚠️ Hati-hati mengaktifkan tier baru. Pastikan billing dan fitur sudah siap di production.</span>
              </div>
              <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden", boxShadow:T.cardShadow }}>
                {flags.map((flag,i) => (
                  <div key={flag.key} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderBottom:i<flags.length-1?`1px solid ${T.border}`:"none", background:i%2===0?T.surface:T.surfaceHover }}>
                    <Toggle enabled={flag.enabled} onChange={()=>toggleFlag(flag.key)} dark={dark} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:T.mono, fontSize:11, color:flag.enabled?T.text:T.textMuted, fontWeight:flag.enabled?600:400 }}>{flag.key}</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{flag.desc}</div>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:flag.enabled?(dark?"rgba(16,185,129,.12)":BRAND.emeraldLight):(dark?"rgba(255,255,255,.04)":T.bgAlt), color:flag.enabled?BRAND.emerald:T.textMuted }}>
                      {flag.enabled?"ON":"OFF"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APP CONFIG */}
          {nav==="config" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:T.text, letterSpacing:-.5, marginBottom:4 }}>App Config</h2>
              <p style={{ fontSize:12, color:T.textSub, marginBottom:18 }}>Setting yang bisa diubah tanpa deploy. Efektif immediately.</p>
              <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden", boxShadow:T.cardShadow }}>
                {[{ key:"ai_quota_go", value:"10", desc:"AI quota Go tier per bulan", editable:true },{ key:"ai_quota_plus", value:"-1 (unlimited)", desc:"AI quota Plus tier", editable:false },{ key:"topup_price_idr", value:"5000", desc:"Harga top-up AI credits (rupiah)", editable:true },{ key:"topup_credits", value:"3", desc:"Credits per top-up", editable:true },{ key:"max_modules_free", value:"3", desc:"Maks modul/bulan untuk Free tier", editable:true },{ key:"maintenance_mode", value:"false", desc:"Toggle maintenance mode", editable:true }].map((cfg,i) => (
                  <div key={cfg.key} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom:i<5?`1px solid ${T.border}`:"none" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:T.mono, fontSize:11, color:T.text }}>{cfg.key}</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{cfg.desc}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:T.mono, fontSize:12, color:BRAND.amber, fontWeight:600 }}>{cfg.value}</span>
                      {cfg.editable && <button style={{ padding:"3px 9px", background:dark?"rgba(79,70,229,.1)":BRAND.indigoLight, color:BRAND.indigo, borderRadius:5, border:"none", fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Edit</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WEBHOOKS */}
          {nav==="webhooks" && (
            <div style={{ animation:"fadeIn .3s ease" }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:T.text, letterSpacing:-.5, marginBottom:4 }}>Webhook Logs</h2>
              <p style={{ fontSize:12, color:T.textSub, marginBottom:18 }}>Semua incoming Xendit webhook events</p>
              <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, overflow:"hidden", boxShadow:T.cardShadow }}>
                {WEBHOOKS.map((w,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"13px 18px", borderBottom:i<WEBHOOKS.length-1?`1px solid ${T.border}`:"none" }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:w.processed?(dark?"rgba(16,185,129,.12)":BRAND.emeraldLight):(dark?"rgba(239,68,68,.12)":BRAND.redLight), color:w.processed?BRAND.emerald:BRAND.red, whiteSpace:"nowrap", flexShrink:0, marginTop:2 }}>
                      {w.processed?"✓ OK":"✗ ERR"}
                    </span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:T.mono, fontSize:11, color:T.text }}>{w.event}</div>
                      <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>{w.payload}</div>
                      {w.error && <div style={{ fontSize:10, color:BRAND.red, marginTop:2 }}>Error: {w.error}</div>}
                    </div>
                    <span style={{ fontSize:10, color:T.textMuted, flexShrink:0 }}>{w.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FALLBACK */}
          {!["dashboard","analytics","users","curated","curriculum","flags","config","webhooks"].includes(nav) && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:260, color:T.textMuted }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🚧</div>
              <div style={{ fontWeight:700, fontSize:14, color:T.text }}>"{nav}" belum dibuat</div>
            </div>
          )}
        </div>
      </div>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={()=>setSelectedUser(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:18, padding:"24px", maxWidth:460, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,.3)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
              <h3 style={{ fontWeight:800, fontSize:17, color:T.text, letterSpacing:-.5 }}>{selectedUser.name}</h3>
              <button onClick={()=>setSelectedUser(null)} style={{ color:T.textMuted, background:"none", border:"none", cursor:"pointer", fontSize:20 }}>×</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:18 }}>
              {[{ label:"Email", val:selectedUser.email },{ label:"Sekolah", val:selectedUser.school },{ label:"Plan", val:selectedUser.plan.toUpperCase() },{ label:"Status", val:selectedUser.status },{ label:"Total Modul", val:selectedUser.modules },{ label:"AI Used", val:selectedUser.ai_used===-1?"Unlimited":selectedUser.ai_used }].map(f => (
                <div key={f.label} style={{ background:T.bgAlt, borderRadius:8, padding:"9px 11px" }}>
                  <div style={{ fontSize:10, color:T.textMuted, marginBottom:2 }}>{f.label}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{f.val}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:7 }}>
              <button style={{ flex:1, padding:"9px", background:dark?"rgba(79,70,229,.1)":BRAND.indigoLight, color:BRAND.indigo, borderRadius:8, border:"none", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Tambah Quota</button>
              <button style={{ flex:1, padding:"9px", background:dark?"rgba(245,158,11,.1)":BRAND.amberLight, color:BRAND.amber, borderRadius:8, border:"none", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Extend Sub</button>
              <button style={{ flex:1, padding:"9px", background:dark?"rgba(239,68,68,.1)":BRAND.redLight, color:BRAND.red, borderRadius:8, border:"none", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Suspend</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM PUBLISH */}
      {confirmPublish && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setConfirmPublish(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:T.surface, border:`1.5px solid ${BRAND.red}44`, borderRadius:18, padding:"26px", maxWidth:380, width:"90%", textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:14 }}>⚠️</div>
            <h3 style={{ fontWeight:800, fontSize:18, color:T.text, marginBottom:7 }}>Publish Kurikulum Baru?</h3>
            <p style={{ fontSize:13, color:T.textSub, marginBottom:20, lineHeight:1.7 }}>Ini akan trigger auto-migrate untuk <strong style={{ color:T.text }}>847 modul</strong>. Proses tidak bisa dibatalkan.</p>
            <div style={{ display:"flex", gap:9 }}>
              <button className="hov-btn" onClick={()=>setConfirmPublish(false)} style={{ flex:1, padding:"10px", background:T.bgAlt, color:T.textSub, borderRadius:9, border:`1px solid ${T.border}`, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Batal</button>
              <button className="hov-btn" onClick={()=>setConfirmPublish(false)} style={{ flex:1, padding:"10px", background:BRAND.red, color:"#FFF", borderRadius:9, border:"none", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Ya, Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
