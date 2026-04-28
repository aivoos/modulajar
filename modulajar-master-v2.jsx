import { useState } from "react";

// ─── SINGLE SOURCE OF TRUTH ───────────────────────────────────────────────────
const PRICING = {
  free:    { label: "Free",    color: "#475569", monthly: 0,      yearly: 0,       ai_quota: 0,  full_ai: false, download: false, model: "-" },
  go:      { label: "Go",      color: "#4F46E5", monthly: 49000,  yearly: 490000,  ai_quota: 10, full_ai: true,  download: true, model: "gpt-4o-mini" },
  plus:    { label: "Plus",    color: "#F59E0B", monthly: 99000,  yearly: 990000,  ai_quota: 20, full_ai: true,  download: true, model: "gpt-4o-mini" },
  sekolah: { label: "Sekolah", color: "#10B981", monthly: 70000, yearly: 840000, ai_quota: 25, full_ai: true, download: true, min_seats: 6, price_per_seat: 70000 },
};
const TOPUP = { price: 10000, credits: 3 };
const AI_COST = { per_module_idr: 800, per_module_usd: 0.025, model: "gpt-4o-mini" };
const STACK = {
  fe: "Next.js 15 + Tailwind + shadcn/ui + Plus Jakarta Sans",
  be: "Elysia + Bun → Railway",
  db: "Supabase Postgres + RLS + Storage + Auth + Edge Functions",
  ai: "OpenAI gpt-4o-mini semua tier — cukup untuk modul ajar Kurikulum Merdeka",
  pay: "Xendit (QRIS, GoPay, OVO, Dana, VA, Retail)",
  email: "Resend + React Email",
  analytics: "Posthog EU",
  monitoring: "Sentry + Betterstack",
  pwa: "next-pwa + Workbox + Dexie.js (IndexedDB)",
  deploy: "Vercel (FE) + Railway (BE)",
  repo: "Turborepo + pnpm workspaces",
};

// ─── ALL 16 DECISIONS ─────────────────────────────────────────────────────────
const DECISIONS = [
  {
    id: "ADR-001", status: "accepted",
    title: "Elysia + Bun sebagai API server (Railway)",
    decision: "Dedicated persistent API server — bukan Next.js API Routes yang serverless.",
    reason: "Full AI mode jalan 30–60 detik. Serverless timeout di 10–30 detik. SSE streaming butuh koneksi persistent.",
    impact: ["SSE streaming agent progress berjalan smooth", "Deploy split: Vercel (FE) + Railway (BE)", "Railway cost ~$5/bulan"],
  },
  {
    id: "ADR-002", status: "accepted",
    title: "OpenAI GPT-4o-mini/4o sebagai AI engine + ABI TIERS pricing",
    decision: "GPT-4o-mini (Go ~Rp 800/modul), GPT-4o (Plus ~Rp 3.000/modul), GPT-4o-turbo (Sekolah). FREE = blocked.",
    reason: "Cheaper than Claude. gpt-4o-mini足够 untuk Go tier. GPT-4o for Plus/Sekolah where quality matters more.",
    impact: ["Margin Go: ~98%. Plus avg: ~96%. Sekolah: ~99%", "ABI TIERS: model naik = kualitas naik, pricing naik", "Rate limiting per tier (concurrent + RPM + monthly quota)"],
  },
  {
    id: "ADR-002", status: "accepted",
    title: "Xendit sebagai payment gateway",
    decision: "Xendit satu-satunya processor. Support QRIS, GoPay, OVO, Dana, VA Bank, Indomaret/Alfamart, Invoice.",
    reason: "Stripe tidak support metode pembayaran lokal Indonesia. Xendit juga bisa generate Invoice ber-NPWP untuk BOS.",
    impact: ["Coverage payment method Indonesia paling luas", "Invoice BOS dengan PPN 11%", "Webhook handler harus idempotent"],
  },
  {
    id: "ADR-003", status: "accepted",
    title: "Tier Go: quota 10 Full AI/bulan. Tier Plus: unlimited semua AI",
    decision: "Go = 10 modul Full AI + 5 batch deskripsi nilai/bulan. Plus = unlimited semua AI operations.",
    reason: "AI cost per modul ~Rp 16.000. Go Rp 49.000 tidak sustain unlimited. Plus Rp 99.000 dengan avg 15 ops/bulan = margin ~50%.",
    impact: ["Unit economics positif di semua tier", "Plus punya clear upgrade reason vs Go", "Perlu quota check sebelum dispatch AI"],
  },
  {
    id: "ADR-004", status: "accepted",
    title: "Free tier tidak bisa download PDF",
    decision: "Free: buat + preview di app. Download PDF hanya Go ke atas.",
    reason: "PDF adalah deliverable utama guru. Guru invest waktu buat modul → 1 klik download → conversion lever terkuat.",
    impact: ["Upgrade prompt muncul saat klik download", "Preview harus bagus agar user betah di Free", "Share link publik juga locked di Free"],
  },
  {
    id: "ADR-005", status: "accepted",
    title: "Monorepo Turborepo + pnpm workspaces",
    decision: "apps/web (Next.js), apps/api (Elysia), packages/db, packages/agents, packages/shared.",
    reason: "Type safety end-to-end tanpa duplikasi. Solo dev = satu PR untuk perubahan cross-layer.",
    impact: ["Build cache via Turborepo", "Single git repo", "Sedikit lebih complex setup awal"],
  },
  {
    id: "ADR-006", status: "accepted",
    title: "Kurikulum versioning: schema-driven template + auto-migrate Edge Function",
    decision: "Module.content = JSONB driven by ModuleTemplate.schema. Migration auto via Edge Function, guru review diff.",
    reason: "Kurikulum Indonesia sering ganti. Konten guru tidak boleh rusak. Guru tidak boleh harus tulis ulang dari awal.",
    impact: ["Edge Function harus battle-tested", "migration_rules ditulis hati-hati oleh admin", "UI diff review kritis"],
  },
  {
    id: "ADR-007", status: "accepted",
    title: "Invoice PDF: React-PDF. Modul export: Puppeteer",
    decision: "Dua library berbeda untuk dua use case. Keduanya jalan di Elysia, upload ke Supabase Storage.",
    reason: "Invoice BOS butuh tabel structured. Modul export butuh full HTML fidelity untuk format Kemendikbud.",
    impact: ["Puppeteer butuh RAM lebih — monitor Railway", "Signed URL 30 hari invoice, 7 hari export"],
  },
  {
    id: "ADR-008", status: "accepted",
    title: "Master data siswa: Import Excel (bukan Dapodik, bukan manual)",
    decision: "Upload .xlsx → parse SheetJS → preview → confirm. Kolom wajib: Nama. Optional: NIS, gender.",
    reason: "Dapodik = aplikasi desktop bukan REST API publik, tidak bisa diintegrasikan. Manual input 30-40 siswa = friction terlalu tinggi. Guru sudah punya Excel dari sekolah.",
    impact: ["Import 30 detik → langsung siap", "Guru bisa edit/tambah manual setelah import", "Data siswa scope per teaching_class"],
  },
  {
    id: "ADR-009", status: "accepted",
    title: "Tahun ajaran sebagai container, data lama tetap accessible",
    decision: "Tabel academic_years. Semua teaching_class, jurnal, nilai scoped ke academic_year_id. Data lama archived tapi bisa dilihat.",
    reason: "Guru PNS butuh akses data semester lalu untuk bukti PKG. Data tidak boleh hilang saat ganti semester.",
    impact: ["Filter dropdown tahun ajaran di semua halaman", "Duplicate kelas dari semester lalu", "Auto-prompt setup kelas di awal semester"],
  },
  {
    id: "ADR-010", status: "accepted",
    title: "Format nilai: angka 0-100 (sumatif) + deskripsi AI-generated",
    decision: "Nilai akhir = rata-rata sumatif saja (formatif tidak dicampur). Deskripsi per siswa di-generate AI dari data nilai.",
    reason: "Kurikulum Merdeka: nilai rapor tetap angka 0-100. Deskripsi kualitatif wajib ada tapi paling menyiksa untuk ditulis manual. Formatif dan sumatif tidak boleh dicampur per panduan Kemendikbud.",
    impact: ["AI generate deskripsi per siswa per mapel", "Guru review + edit sebelum finalisasi", "Ini yang paling menghemat waktu guru"],
  },
  {
    id: "ADR-011", status: "accepted",
    title: "Modulajar = Bukti Kinerja PMM companion, BUKAN pengganti PMM",
    decision: "Tidak membuat PKG report standalone. Modulajar generate semua BUKTI yang diupload ke PMM. 'Paket Bukti Kinerja' = ZIP semua dokumen per semester.",
    reason: "Sejak Januari 2024, PKG/SKP guru ASN WAJIB via Platform Merdeka Mengajar (PMM) terintegrasi e-Kinerja BKN. Modulajar tidak bisa replace sistem pemerintah. Tapi guru mengeluhkan kesulitan mengisi BUKTI di PMM — di sinilah Modulajar masuk.",
    impact: ["Positioning: 'Bukti PMM kamu siap dalam 1 klik'", "Paket Bukti = rekap jurnal + nilai + modul + refleksi (ZIP)", "Tidak ada friction kompetisi dengan pemerintah"],
  },
  {
    id: "ADR-012", status: "accepted",
    title: "PWA dengan offline-first untuk jurnal + absensi",
    decision: "next-pwa + Workbox + Dexie.js (IndexedDB). Offline: jurnal, absensi, daftar siswa. Online-only: AI, library, billing.",
    reason: "Jurnal harian HARUS bisa diisi tanpa internet. Banyak guru di daerah sinyal buruk. Absensi di kelas — HP sering tidak ada sinyal.",
    impact: ["UI indicator 'Mode offline — data tersimpan lokal'", "Background sync saat koneksi kembali", "Last-write-wins conflict resolution"],
  },
  {
    id: "ADR-013", status: "accepted",
    title: "Notifikasi: PWA push (primary) + email fallback. WhatsApp future",
    decision: "v1.0: PWA push notification berdasarkan jadwal kelas. v1.5: WhatsApp via Fonnte (opt-in).",
    reason: "Email open rate rendah untuk guru. PWA push efektif kalau app sudah diinstall. WhatsApp paling reliable tapi butuh Fonnte API (Rp 50rb/bulan).",
    impact: ["Reminder muncul 30 menit setelah jam kelas selesai", "Max 3 reminder/hari per user", "Tidak spam kalau jurnal sudah diisi"],
  },
  {
    id: "ADR-014", status: "accepted",
    title: "Bank soal: private per guru, opt-in share ke public library",
    decision: "Soal private by default. Guru bisa explicitly publish ke public library (seperti curated modules).",
    reason: "Soal bersifat personal (disesuaikan konteks sekolah). Privacy by default. Sharing = viral growth opt-in.",
    impact: ["questions table dengan is_public flag", "Public soal bisa difork seperti modul", "AI generate soal dari kisi-kisi (per TP)"],
  },
  {
    id: "ADR-015", status: "accepted",
    title: "Rapor/LHB: SKIP v1.0, export-friendly ke e-Rapor di v1.5",
    decision: "v1.0: nilai + deskripsi AI tersedia di app, guru copy-paste ke e-Rapor manual. v1.5: export format compatible dengan e-Rapor import.",
    reason: "e-Rapor sudah ada sistem resmi Kemendikbud. Integrasi complex dan butuh akun operator sekolah. Value prop v1.0: 'Modulajar generate kontennya, kamu paste ke e-Rapor'.",
    impact: ["Tidak add scope ke v1.0", "Format nilai sudah compatible untuk copy-paste", "Instruksi step-by-step cara paste ke e-Rapor di help center"],
  },
  {
    id: "ADR-016", status: "accepted",
    title: "Data portability: data ikut guru, bukan sekolah",
    decision: "Saat guru mutasi/pindah sekolah: modul ajar, jurnal, nilai tetap milik guru. Teaching classes dari sekolah lama: archived, bisa dibaca.",
    reason: "Guru PNS sering dimutasi. Modul ajar = karya intelektual guru. Jurnal = rekam jejak pribadi guru.",
    impact: ["School plan: sekolah bisa lihat modul guru yang aktif saja", "Sekolah tidak retain data setelah guru resign/mutasi", "Arsip tetap accessible untuk guru"],
  },
  {
    id: "ADR-017", status: "accepted",
    title: "Kop surat sekolah + proteksi tube-selling",
    decision: "Plus/Sekolah bisa upload kop surat (logo, nama, NPSN, alamat) → muncul di header PDF. Watermark nama+NIP di footer setiap halaman. Attribution tersimpan di every module (user_id + nip).",
    reason: "Modul ajar yang resmi butuh kop surat sekolah untuk administrasi PKG/PMM. Watermark untuk discourage tube-selling. Attribution untuk traceability kalau ada abuse.",
    impact: ["PDF modul pakai kop surat resmi → guru betah upgrade ke Plus", "Watermark discourage redistribution", "Setiap modul bisa ditrace ke creator via user_id+nip", "Sekolah plan: admin upload master kop → auto-apply ke semua guru di sekolah"],
  },
];

// ─── SCHEMA ───────────────────────────────────────────────────────────────────
const SCHEMA = [
  {
    domain: "Auth & Identity", color: "#6366F1",
    tables: [
      { name: "users", fields: ["id uuid PK", "email text UNIQUE", "full_name text", "role: guru|admin|kepala_sekolah|super_admin", "school_id uuid FK", "avatar_url text", "phone_wa text (opsional, untuk notif WA)", "onboarding_done boolean", "nip text (NIP guru ASN, opsional)"] },
      { name: "schools", fields: ["id uuid PK", "name text", "npsn text", "subdomain text UNIQUE", "npwp text", "address text", "plan: free|go|plus|sekolah", "logo_url text"] },
    ],
  },
  {
    domain: "Tahun Ajaran & Kelas", color: "#10B981",
    tables: [
      { name: "academic_years", fields: ["id uuid PK", "label text ('2024/2025 Ganjil')", "semester: ganjil|genap", "start_date date", "end_date date", "is_active boolean", "school_id uuid FK"] },
      { name: "teaching_classes", fields: ["id uuid PK", "user_id uuid FK", "school_id uuid FK", "academic_year_id uuid FK", "subject text", "grade text ('8')", "class_name text ('8A')", "phase text ('D')", "schedule jsonb ([{day, time_start, time_end}])", "student_count int"] },
      { name: "students", fields: ["id uuid PK", "teaching_class_id uuid FK", "name text", "nis text", "gender: L|P", "notes text", "is_active boolean"] },
    ],
  },
  {
    domain: "Modul Ajar & Kurikulum", color: "#8B5CF6",
    tables: [
      { name: "curriculum_versions", fields: ["id uuid PK", "name text", "code text UNIQUE", "phase text", "year int", "status: draft|active|deprecated"] },
      { name: "module_templates", fields: ["id uuid PK", "curriculum_version_id uuid FK", "subject text", "schema jsonb", "migration_rules jsonb"] },
      { name: "learning_outcomes", fields: ["id uuid PK", "curriculum_version_id uuid FK", "subject text", "phase text", "elemen text", "sub_elemen text", "deskripsi text"] },
      { name: "modules", fields: ["id uuid PK", "user_id uuid FK", "school_id uuid FK", "curriculum_version_id uuid FK", "teaching_class_id uuid FK (optional link)", "title text", "subject text", "phase text", "grade text", "content jsonb", "status: draft|published|archived", "mode: full_ai|curated|scratch", "is_curated boolean", "is_public boolean", "slug text UNIQUE", "fork_count int", "source_module_id uuid FK self"] },
      { name: "module_migrations", fields: ["id uuid PK", "module_id uuid FK", "from_version_id uuid FK", "to_version_id uuid FK", "status: pending_review|accepted|rejected", "diff jsonb", "migrated_at timestamptz"] },
    ],
  },
  {
    domain: "Jurnal & Absensi", color: "#F59E0B",
    tables: [
      { name: "journals", fields: ["id uuid PK", "user_id uuid FK", "teaching_class_id uuid FK", "module_id uuid FK (optional link ke modul)", "academic_year_id uuid FK", "date date", "topic text", "activity_summary text", "notes text", "tp_achievement: 0-100 (ketercapaian TP hari ini)", "photo_urls text[]", "is_synced boolean (untuk offline)"] },
      { name: "attendances", fields: ["id uuid PK", "journal_id uuid FK", "student_id uuid FK", "status: H|S|I|A", "notes text"] },
    ],
  },
  {
    domain: "Penilaian & Nilai", color: "#EF4444",
    tables: [
      { name: "grade_entries", fields: ["id uuid PK", "user_id uuid FK", "teaching_class_id uuid FK", "student_id uuid FK", "academic_year_id uuid FK", "assessment_type: formatif|sumatif", "tp_code text", "score numeric(5,2)", "label text (Mulai Berkembang/Berkembang/dst, untuk formatif)", "notes text", "assessed_at date"] },
      { name: "grade_summaries", fields: ["id uuid PK (computed/materialized)", "teaching_class_id uuid FK", "student_id uuid FK", "academic_year_id uuid FK", "final_score numeric(5,2) (avg sumatif)", "description text (AI-generated)", "description_draft boolean", "generated_at timestamptz"] },
      { name: "questions", fields: ["id uuid PK", "user_id uuid FK", "module_id uuid FK", "type: PG|isian|uraian|benar_salah", "content text", "options jsonb (untuk PG)", "answer text", "rubric text", "tp_code text", "difficulty: mudah|sedang|sulit", "is_public boolean", "fork_count int"] },
      { name: "question_sets", fields: ["id uuid PK", "user_id uuid FK", "title text", "module_id uuid FK", "questions uuid[]", "is_curated boolean"] },
    ],
  },
  {
    domain: "AI Agent Layer", color: "#A78BFA",
    tables: [
      { name: "agent_jobs", fields: ["id uuid PK", "user_id uuid FK", "job_type: modul_generate|prota_promes|bank_soal|deskripsi_nilai|bukti_kinerja|assist", "status: queued|running|done|failed", "input jsonb", "output jsonb", "tokens_used int", "cost_idr int", "started_at, finished_at timestamptz"] },
      { name: "agent_steps", fields: ["id uuid PK", "job_id uuid FK", "agent: orchestrator|cp|tp|atp|activity|asesmen|validator|prota|promes|soal|deskripsi|refleksi", "status: pending|running|done|failed", "output jsonb", "started_at, finished_at timestamptz"] },
    ],
  },
  {
    domain: "Billing", color: "#EC4899",
    tables: [
      { name: "subscriptions", fields: ["id uuid PK", "user_id uuid FK", "school_id uuid FK", "plan: free|go|plus|sekolah", "billing_cycle: monthly|yearly", "status: active|past_due|cancelled", "ai_quota_used int", "ai_quota_limit int (-1 = unlimited)", "period_start, period_end timestamptz", "grace_period_end timestamptz", "xendit_subscription_id text", "invoice_data jsonb (NPWP, nama lembaga)"] },
      { name: "payments", fields: ["id uuid PK", "subscription_id uuid FK", "xendit_payment_id text UNIQUE", "amount_idr int", "method text", "status: paid|pending|failed|expired", "invoice_url text", "paid_at timestamptz"] },
      { name: "topups", fields: ["id uuid PK", "user_id uuid FK", "xendit_payment_id text UNIQUE", "ai_credits int", "amount_idr int", "status: paid|pending|failed", "paid_at timestamptz"] },
    ],
  },
];

// ─── FEATURE MAP ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    category: "Modul Ajar",
    items: [
      { name: "Buat modul (Scratch + Assist)", free: true, go: true, plus: true, sekolah: true },
      { name: "Full AI Generate modul", free: "2/bln", go: "10/bln", plus: "20/bln", sekolah: "Unlimited" },
      { name: "Download PDF bersih", free: false, go: true, plus: true, sekolah: true },
      { name: "Kop Surat Sekolah di PDF", free: false, go: true, plus: true, sekolah: true },
      { name: "Curated Library + Fork", free: true, go: true, plus: true, sekolah: true },
      { name: "Share link publik", free: false, go: true, plus: true, sekolah: true },
      { name: "Prota & Promes AI", free: false, go: false, plus: true, sekolah: true },
    ],
  },
  {
    category: "Jurnal & Absensi (Harian)",
    items: [
      { name: "Jurnal mengajar harian", free: false, go: true, plus: true, sekolah: true },
      { name: "Absensi siswa per kelas", free: false, go: true, plus: true, sekolah: true },
      { name: "Import siswa dari Excel", free: false, go: true, plus: true, sekolah: true },
      { name: "Offline mode (PWA)", free: false, go: true, plus: true, sekolah: true },
      { name: "Push notification jadwal", free: false, go: true, plus: true, sekolah: true },
      { name: "Rekap jurnal bulanan PDF", free: false, go: true, plus: true, sekolah: true },
    ],
  },
  {
    category: "Penilaian",
    items: [
      { name: "Input nilai formatif + sumatif", free: false, go: true, plus: true, sekolah: true },
      { name: "Rekap nilai per TP per siswa", free: false, go: true, plus: true, sekolah: true },
      { name: "Deskripsi nilai AI (per siswa)", free: false, go: "5 batch/bln", plus: "Unlimited", sekolah: "Unlimited" },
      { name: "Bank Soal AI (kisi-kisi → soal)", free: false, go: false, plus: true, sekolah: true },
      { name: "Analisis ketercapaian TP", free: false, go: true, plus: true, sekolah: true },
    ],
  },
  {
    category: "Bukti Kinerja PMM",
    items: [
      { name: "Paket Bukti PMM (ZIP semua)", free: false, go: false, plus: true, sekolah: true },
      { name: "Refleksi Pembelajaran AI", free: false, go: false, plus: true, sekolah: true },
      { name: "Rekap kinerja semester PDF", free: false, go: false, plus: true, sekolah: true },
    ],
  },
  {
    category: "Sekolah & Admin",
    items: [
      { name: "Dashboard kepala sekolah", free: false, go: false, plus: false, sekolah: true },
      { name: "Upload master jadwal sekolah", free: false, go: false, plus: false, sekolah: true },
      { name: "Rekap PKG semua guru", free: false, go: false, plus: false, sekolah: true },
      { name: "Invoice BOS resmi (NPWP)", free: false, go: false, plus: false, sekolah: true },
      { name: "Max users", free: "1", go: "1", plus: "1", sekolah: "50" },
    ],
  },
];

// ─── DAILY ROADMAP ────────────────────────────────────────────────────────────
const ROADMAP = [
  {
    week: "Week 1", phase: "Phase 0 — Foundation", color: "#6366F1",
    days: [
      { day: "Day 1", focus: "Monorepo + Supabase Init", tasks: ["pnpm create turbo@latest modulajar", "Setup apps/web (Next.js 15), apps/api (Elysia+Bun), packages/db, packages/agents, packages/shared, packages/emails", "supabase init + supabase start (local)", "Buat 2 Supabase project: production + staging", "Commit ke GitHub, connect Railway + Vercel"], output: "Repo berjalan lokal tanpa error.", blocker: "Railway + Vercel butuh credit card untuk custom domain — setup sekarang." },
      { day: "Day 2", focus: "Database Schema — Semua Tabel", tasks: ["Migration 001: schools, users, academic_years, curriculum_versions, module_templates, learning_outcomes", "Migration 002: teaching_classes, students, modules, module_migrations, module_exports", "Migration 003: journals, attendances, grade_entries, grade_summaries, questions, question_sets", "Migration 004: agent_jobs, agent_steps, subscriptions, payments, topups", "Migration 005: notifications, audit_logs, feedbacks, feature_flags, app_config, webhook_logs, invoice_sequences", "supabase db push ke staging → verifikasi semua tabel"], output: "25+ tabel exist di staging. Tidak ada migration error.", blocker: "Enable uuid-ossp + pg_trgm + unaccent extension sebelum migration." },
      { day: "Day 3", focus: "RLS Policy + Indexes", tasks: ["RLS semua tabel: users (own row), modules (user_id + school_id), teaching_classes (user_id), students (via teaching_class)", "RLS billing: server-only write via service_role", "RLS public: modules WHERE is_curated=true (tanpa auth), modules WHERE is_public=true", "Indexes: modules(user_id), modules(school_id), teaching_classes(user_id+academic_year_id), students(teaching_class_id), agent_jobs(user_id), payments(xendit_payment_id UNIQUE)", "GIN index: modules(search_vector) untuk FTS", "Test RLS dengan anon key dan authenticated key"], output: "Isolation terbukti. Anon key tidak bisa baca data user lain.", blocker: "Test edge case: curated + public modules bisa dibaca tanpa auth." },
      { day: "Day 4", focus: "Elysia Bootstrap + Auth Setup", tasks: ["Elysia: bun create elysia apps/api, setup cors, rate-limit, bearer auth middleware", "GET /health → { status, timestamp, version }", "Supabase Auth: enable email + Google SSO, kustomisasi email template (Bahasa Indonesia)", "Google OAuth: setup Google Cloud Console → Client ID + Secret ke Supabase", "Railway: deploy Elysia → verify /health returns 200", "Setup .env.example dengan semua required keys, buat checklist README"], output: "api.modulajar.app/health returns 200. Google OAuth berjalan.", blocker: "Railway custom domain butuh 30 menit setup — sisihkan waktu." },
      { day: "Day 5", focus: "Next.js Bootstrap + CI/CD", tasks: ["Next.js 15: App Router, Tailwind, shadcn/ui init, Plus Jakarta Sans", "Setup @supabase/ssr client (server + browser)", "Auth middleware: redirect /login kalau tidak ada session", "GitHub Actions: ci.yml (typecheck + lint on PR), deploy.yml (deploy on main merge)", "Vercel: connect repo, env vars, deploy → verify load tanpa error", "Test full CI/CD pipeline: PR → CI hijau → merge → auto-deploy"], output: "modulajar.app load. CI/CD pipeline hijau end-to-end.", blocker: "Vercel + Railway env vars harus sync — document semua di README." },
    ],
  },
  {
    week: "Week 2", phase: "Phase 0 — Foundation", color: "#6366F1",
    days: [
      { day: "Day 6", focus: "Seed Data CP + Kurikulum", tasks: ["Download PDF CP dari BSKAP Kemendikbud (semua mapel Fase A-F)", "Buat seed script: packages/db/seed/learning-outcomes.ts", "Seed prioritas: Matematika, IPA, IPS, Bahasa Indonesia, Bahasa Inggris (Fase A-F)", "Seed lanjutan: PPKN, Seni, PJOK, Informatika", "Seed CurriculumVersion: Kurikulum Merdeka 2022 (status: active)", "Seed ModuleTemplate: schema 11 section Kurikulum Merdeka", "Seed app_config: ai_quota_per_plan, topup_price, maintenance_mode=false", "Seed feature_flags: initial flags"], output: "learning_outcomes terisi. ModuleTemplate seeded. app_config ready.", blocker: "PDF CP per mapel format tidak konsisten — butuh manual review ~2 jam." },
      { day: "Day 7", focus: "Security + Legal Pages", tasks: ["next.config.ts: security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)", "app/(marketing)/terms/page.tsx, privacy/page.tsx, refund/page.tsx (draft content)", "Lighthouse security audit: pastikan CSP tidak block assets yang dibutuhkan", "Test: tidak ada mixed content warning di browser console"], output: "Security headers aktif. 3 halaman legal live (draft).", blocker: "CSP terlalu ketat bisa block Supabase/Posthog — test dulu." },
      { day: "Day 8", focus: "Posthog + Sentry + Betterstack", tasks: ["Posthog EU: install posthog-js di Next.js, posthog-node di Elysia", "Cookie consent banner: simpan preference localStorage", "Sentry: install @sentry/nextjs + @sentry/node, source maps upload", "Test: trigger error buatan → verify muncul di Sentry", "Betterstack: setup status page di status.modulajar.app, monitor /health endpoint", "PWA setup: install next-pwa, configure service worker, manifest.json"], output: "Posthog menerima events. Sentry menerima errors. Status page live. PWA installable.", blocker: "Sentry DSN harus di env vars — jangan hardcode." },
      { day: "Day 9", focus: "Auth Pages + Onboarding", tasks: ["app/(auth)/login/page.tsx — Google SSO (primary) + email/password", "app/(auth)/register/page.tsx — form + ToS checkbox wajib", "app/(auth)/forgot-password/page.tsx", "Email verification middleware: redirect kalau belum verify", "app/(app)/onboarding/page.tsx — 3 step: nama+sekolah, mapel, fase+kelas default", "Simpan onboarding data ke users, set onboarding_done=true", "Middleware: redirect ke /onboarding kalau belum selesai"], output: "Full auth flow berjalan. Onboarding 3 step selesai.", blocker: "Email verification Supabase: kustomisasi template agar tidak terkesan spam." },
      { day: "Day 10", focus: "Academic Year + Dashboard", tasks: ["API: GET/POST/PATCH academic_years", "Auto-create academic_year untuk semester aktif kalau belum ada", "Prompt awal semester: 'Semester baru dimulai, setup kelas sekarang?'", "app/(app)/dashboard/page.tsx: greeting WIB, stat cards, quota bar, empty state", "Parallel fetch dashboard data: user + modules count + subscription + pending migrations", "Buffer: review + fix semua issue Week 1-2, update README"], output: "Dashboard load < 1.5s. Academic year lifecycle berjalan.", blocker: "Greeting harus time-aware WIB: Intl.DateTimeFormat({ timeZone: 'Asia/Jakarta' })." },
    ],
  },
  {
    week: "Week 3", phase: "Phase 1 — Core Editor & Kelas", color: "#10B981",
    days: [
      { day: "Day 11", focus: "Teaching Class CRUD", tasks: ["app/(app)/classes/page.tsx — list kelas per academic year", "app/(app)/classes/new/page.tsx — form buat kelas: mapel, grade, class_name, jadwal", "Jadwal input: multi-day picker (Senin-Sabtu) + time picker per hari", "Elysia: GET/POST/PATCH/DELETE /teaching-classes", "Filter by academic_year_id, subject, grade", "Empty state: 'Belum ada kelas. Buat kelas pertama untuk mulai mengajar.'"], output: "Guru bisa buat dan manage kelas per semester.", blocker: "Jadwal multi-hari UI bisa complex — pakai checkbox grid yang simple." },
      { day: "Day 12", focus: "Import Siswa dari Excel", tasks: ["Elysia: POST /teaching-classes/:id/students/import (multipart/form-data)", "Backend: parse XLSX via SheetJS, validate kolom Nama wajib ada, return preview rows", "Frontend: upload UI → preview tabel siswa → confirm import", "Handle: nama duplikat (skip), NIS duplikat (skip + warn), baris kosong (skip)", "Fallback: tambah siswa manual satu per satu", "CRUD siswa: edit nama/NIS, nonaktifkan siswa (is_active=false)", "Duplicate kelas dari semester lalu: copy daftar siswa ke academic_year baru"], output: "Import 35 siswa dari Excel selesai dalam < 30 detik.", blocker: "Excel guru bisa format tidak standar — coba beberapa format umum sebelum finalisasi parser." },
      { day: "Day 13", focus: "Modul Ajar — List + Mode Selection", tasks: ["app/(app)/modules/page.tsx — list modul, filter status + search", "app/(app)/modules/new/page.tsx — 3 card mode: Full AI (locked Free) / Curated / Scratch", "Elysia: GET/POST/PATCH/DELETE /modules dengan RLS", "Link modul ke teaching_class (optional tapi recommended)", "Module status flow: draft → published → archived", "Curated library: GET /library?q=&subject=&phase=&grade= → FTS Postgres"], output: "List modul berjalan. Mode selection berjalan dengan plan gating.", blocker: "FTS indonesian tokenizer: CREATE TEXT SEARCH CONFIGURATION dulu." },
      { day: "Day 14", focus: "Dynamic Form Renderer + Scratch Editor", tasks: ["packages/shared: type ModuleTemplateSchema, ModuleContent", "Komponen <DynamicForm schema={} value={} onChange={} />: render field dari JSONB schema", "Field types: text (Tiptap rich text), select, number, multiline plain", "Tiptap: install + setup, dynamic import dengan ssr: false", "Editor layout: sidebar outline (desktop) + accordion (mobile)", "Autosave: useDebounce 2000ms → PATCH /modules/:id/content", "Autosave indicator: 'Tersimpan otomatis X detik lalu' → fade out 3 detik", "Section completion dot: hijau kalau tidak kosong"], output: "Editor berjalan. Autosave berjalan. Section completion tracking berjalan.", blocker: "Tiptap SSR issue Next.js — gunakan dynamic import dengan ssr: false." },
      { day: "Day 15", focus: "Preview + Fork + Phase 1 Polish", tasks: ["app/(app)/modules/[id]/preview/page.tsx — read-only, A4 style layout", "app/m/[slug]/page.tsx — public share page dengan OG image + konversi CTA signup", "Fork: POST /library/:id/fork → copy module user_id=current → redirect editor", "settings/profile: update nama, avatar (Supabase Storage avatars/)", "settings/data: export data + account deletion flow (UU PDP)", "Mobile test: semua halaman di 375px dan 360px", "Lighthouse: target LCP < 2.5s di semua halaman"], output: "Phase 1 core complete. Mobile responsif. Public share page live.", blocker: "OG image: Plus Jakarta Sans harus di-embed di @vercel/og." },
    ],
  },
  {
    week: "Week 4", phase: "Phase 2 — Jurnal & Absensi (Fitur Harian)", color: "#F59E0B",
    days: [
      { day: "Day 16", focus: "Jurnal Mengajar — Core Flow", tasks: ["app/(app)/journals/page.tsx — list jurnal, filter by kelas + tanggal", "app/(app)/journals/new/page.tsx — form buat jurnal", "Form minimal (60 detik): tanggal (auto today), pilih kelas (dropdown dari jadwal hari ini), topik (auto-fill dari modul yang linked ke kelas), catatan opsional", "Form detail (expandable): kegiatan pendahuluan/inti/penutup, ketercapaian TP (slider 0-100%), foto upload (1-3)", "Elysia: GET/POST/PATCH /journals dengan RLS per user_id", "Auto-link modul: cari modul yang subject + grade cocok dengan kelas → suggest sebagai topik"], output: "Jurnal bisa dibuat dalam 60 detik. Auto-fill topik dari modul berjalan.", blocker: "Auto-fill topik butuh smart matching subject+grade — keep simple untuk v1: exact match dulu." },
      { day: "Day 17", focus: "Absensi Siswa + Offline Mode", tasks: ["Absensi UI: list siswa per kelas → swipe/tap H/S/I/A per siswa", "Bulk action: 'Semua Hadir' tombol besar lalu edit yang tidak hadir", "Elysia: POST /journals/:id/attendances (batch upsert)", "Dexie.js setup di Next.js untuk IndexedDB", "Offline queue: jurnal + absensi disimpan ke IndexedDB kalau tidak ada koneksi", "Background sync: saat online, flush queue ke Elysia", "UI indicator: banner 'Mode offline — X data menunggu sync'", "PWA manifest: icon, theme_color, display: standalone"], output: "Absensi 30 siswa selesai < 2 menit. Offline mode berjalan di airplane mode.", blocker: "Background sync di iOS Safari terbatas — fallback ke manual sync button." },
      { day: "Day 18", focus: "Push Notification Jadwal + Rekap Jurnal", tasks: ["Service worker: setup push notification handler", "Elysia: POST /notifications/subscribe (simpan push subscription ke DB)", "Cron daily (Edge Function): query teaching_classes WHERE jadwal hari ini → kirim push 30 menit setelah jam_selesai kalau jurnal belum ada", "Logic: skip kalau jurnal sudah diisi, max 3 notif/hari/user", "app/(app)/journals/monthly/page.tsx — rekap jurnal per bulan (calendar view)", "Elysia: GET /journals/export?month=&class_id= → generate PDF rekap via React-PDF", "PDF rekap: header sekolah + guru, tabel per tanggal (kelas, topik, hadir/tidak hadir count)"], output: "Push notification muncul di HP setelah kelas selesai. Export rekap jurnal PDF berjalan.", blocker: "Push notification harus opt-in di browser — prompt user di onboarding." },
      { day: "Day 19", focus: "Input Nilai + Rekap", tasks: ["app/(app)/grades/page.tsx — pilih kelas → list siswa + input nilai per TP", "Toggle: Formatif (feedback only) vs Sumatif (masuk nilai akhir)", "Input grid: siswa × TP, input angka 0-100 per cell", "Auto-hitung nilai akhir: AVG sumatif per siswa", "Flag KKTP: highlight merah kalau di bawah KKTP (threshold setting per kelas)", "Rekap: berapa siswa capai KKTP, berapa butuh remedial", "Elysia: POST/PATCH /grade-entries (batch upsert)", "GET /grade-summaries/:teaching_class_id → return nilai akhir semua siswa"], output: "Input nilai 35 siswa × 5 TP selesai dalam < 10 menit. Rekap KKTP otomatis.", blocker: "Input grid bisa lambat kalau banyak TP — virtualize kalau > 10 TP." },
      { day: "Day 20", focus: "Deskripsi Nilai AI + Phase 2 Test", tasks: ["Elysia: POST /agent/describe-grades { teaching_class_id, academic_year_id }", "Deskripsi Agent: baca semua grade_entries per siswa → generate narasi per siswa", "Output: 'Budi telah menguasai TP-1 dan TP-2. Perlu peningkatan pada TP-3 (Persamaan Linear).'", "Simpan ke grade_summaries.description, set description_draft=true", "UI: per siswa ada tombol [✨ Generate Deskripsi] dan text area untuk edit", "Quota check: Go = 5 batch/bulan, Plus = unlimited", "End-to-end test: setup kelas → import siswa → jurnal → absensi → nilai → deskripsi AI", "Mobile test semua fitur harian di HP real (bukan DevTools)"], output: "Full daily loop berjalan: kelas → jurnal → absensi → nilai → deskripsi AI.", blocker: "Test di HP Android low-end (Rp 1-2 juta) — banyak guru pakainya." },
    ],
  },
  {
    week: "Week 5", phase: "Phase 3 — AI Agent Layer (Modul)", color: "#8B5CF6",
    days: [
      { day: "Day 21", focus: "AI Agent Package + CP Agent", tasks: ["packages/agents: setup dengan Bun, install Anthropic SDK", "AgentBase abstract class: { run(context): Promise<output>, validate(output): boolean }", "CP Agent: query learning_outcomes dari Supabase WHERE subject+phase → return structured JSON", "Zod schema untuk setiap agent output — validate sebelum return ke orchestrator", "Test CP Agent isolated: 20 kali dengan input berbeda → konsistensi > 95%"], output: "CP Agent return CP yang benar dari DB. Zod validation berjalan.", blocker: "Prompt engineering untuk consistent JSON — test banyak edge case (mapel langka, fase A)." },
      { day: "Day 22", focus: "TP + ATP + Activity Agent", tasks: ["TP Agent: CP output → TP ABCD format (Audience, Behavior, Condition, Degree)", "Include Bloom's Taxonomy kata kerja operasional di system prompt", "ATP Agent: TP list + durasi → alur per minggu, logis dan sequential", "Activity Agent: ATP + gaya_belajar → pendahuluan, inti (diferensiasi), penutup", "Test chain CP→TP→ATP→Activity. Verifikasi konten saling terhubung"], output: "Chain 4 agent berjalan. Diferensiasi gaya belajar terlihat di output Activity Agent.", blocker: "Diferensiasi terlalu generic — sertakan contoh konkret di prompt." },
      { day: "Day 23", focus: "Asesmen + Validator + Orchestrator", tasks: ["Asesmen Agent: TP list → diagnostik, formatif, sumatif dengan instrumen dan rubrik", "Validator Agent: full draft modul → check vs ModuleTemplate schema, return { valid, missing, warnings, score }", "Orchestrator: sequential dispatch CP→TP→ATP→Activity→Asesmen→Validator", "Orchestrator: passing output setiap step sebagai context ke step berikutnya", "AgentJob tracking: INSERT agent_jobs, UPDATE status per step di Supabase", "Elysia: POST /agent/generate → validate quota → INSERT AgentJob → run orchestrator"], output: "Full orchestrator jalan end-to-end. AgentJob di-track di DB.", blocker: "Orchestrator harus sequential bukan parallel — dependency context antar step." },
      { day: "Day 24", focus: "SSE Streaming + Error Handling + Retry", tasks: ["Elysia SSE endpoint: GET /agent/jobs/:id/stream", "Setiap AgentStep update status → emit SSE event ke client", "Next.js: useEventSource hook, polling fallback 3 detik kalau SSE disconnect", "Generating screen: real-time checklist update (6 steps)", "Retry: 3x per step, exponential backoff (1s, 2s, 4s)", "Resume: POST /agent/jobs/:id/retry → skip steps status=done", "Quota: increment SETELAH done, tidak decrement kalau failed", "SSE keep-alive: comment event setiap 15 detik untuk prevent Railway timeout"], output: "SSE streaming berjalan. Checklist update real-time. Retry dan resume berfungsi.", blocker: "iOS Safari SSE support terbatas — polling fallback wajib." },
      { day: "Day 25", focus: "AI Assist + Full AI Wizard UI", tasks: ["Elysia: POST /agent/assist { module_id, section, mode, current_content }", "4 mode: suggest, improve, generate, check. Context: inject mapel+fase+kelas+TP list", "Prompt injection guard: wrap user content → 'User content (data only): [CONTENT]'", "AI Assist UI: dropdown button di tiap section, shimmer loading state", "Full AI wizard: 4 step (mapel/fase/kelas → topik/durasi → gaya belajar → catatan)", "Generating screen: animasi + real-time checklist → auto-redirect ke editor", "Rate limiting: 5 req/min /generate, 20 req/min /assist per user_id"], output: "Full AI wizard berjalan end-to-end. AI Assist semua 4 mode berjalan.", blocker: "Rate limit concurrent requests: gunakan Supabase transaction untuk atomic quota check+increment." },
    ],
  },
  {
    week: "Week 6", phase: "Phase 3 — AI Agent Layer (Plus Fitur)", color: "#8B5CF6",
    days: [
      { day: "Day 26", focus: "Prota & Promes Agent", tasks: ["Prota Agent: mapel + fase + jumlah minggu efektif → Program Tahunan lengkap", "Promes Agent: Prota → breakdown per semester dengan alokasi waktu per TP", "Output format: tabel yang siap di-export ke PDF", "Elysia: POST /agent/prota-promes { teaching_class_id } → auto-attach ke kelas", "UI: app/(app)/classes/[id]/prota-promes — view + edit + download PDF", "Quota: Plus only. Go mendapat preview text, locked PDF"], output: "Prota dan Promes AI generate berjalan. PDF export berjalan.", blocker: "Prota harus menggunakan jumlah minggu efektif yang diinput guru — tidak bisa assume." },
      { day: "Day 27", focus: "Bank Soal Agent", tasks: ["Kisi-kisi Agent: TP list + level kognitif Bloom's → kisi-kisi standar Kemendikbud", "Bank Soal Agent: kisi-kisi → soal PG (4 options), isian singkat, uraian, benar-salah", "Include: kunci jawaban + rubrik per soal", "Simpan ke questions table, grouped dalam question_set", "UI: app/(app)/questions — browse question sets, tambah soal manual, edit AI result", "Share toggle: is_public=true → muncul di public question library", "Quota: Plus only"], output: "AI generate 20 soal dari kisi-kisi dalam < 30 detik. Semua soal tersimpan dengan rubrik.", blocker: "Soal PG harus ada distractor yang logis — ajarkan di prompt." },
      { day: "Day 28", focus: "Refleksi + Paket Bukti Kinerja PMM", tasks: ["Refleksi Agent: jurnal + analisis nilai → narasi refleksi pembelajaran per semester", "Output: refleksi 3-5 paragraf sesuai format Kemendikbud untuk upload ke PMM", "app/(app)/performance/page.tsx — halaman Bukti Kinerja PMM", "Tampilkan: daftar semua dokumen yang siap didownload untuk PMM", "Paket Bukti Kinerja: ZIP berisi: rekap jurnal PDF + rekap nilai PDF + daftar modul + refleksi PDF", "POST /agent/generate-bukti-kinerja → async ZIP generation → notify via email + in-app saat siap", "Copywriting: 'Bukti PMM kamu siap. Download dan upload ke PMM.'", "Quota: Plus only"], output: "Paket Bukti PMM ter-generate. ZIP bisa didownload. Email notifikasi terkirim.", blocker: "ZIP generation async — jangan block request. Queue dan notify saat selesai." },
      { day: "Day 29", focus: "AI Cost Tracking + Admin Panel", tasks: ["Hitung cost_idr per AgentJob: usage.input_tokens × input_price + usage.output_tokens × output_price", "Daily cron: aggregate AI cost → insert daily_metrics", "Sentry alert: kalau daily AI cost > Rp 500.000", "Abuse detection: flag user kalau > 20 agent_jobs dalam 1 jam", "app/(admin) — super_admin route dengan middleware", "Admin: CRUD CurriculumVersion + ModuleTemplate + migration_rules JSON editor", "Admin: Business dashboard (MRR, user aktif, AI cost hari ini, conversion rate)", "Admin: User management (search, lihat subscription, override quota, ban)"], output: "AI cost tercatat. Admin panel bisa akses dan manage semua.", blocker: "Admin panel tidak perlu mobile responsive — admin selalu di desktop." },
      { day: "Day 30", focus: "Phase 3 Polish + Full Integration Test", tasks: ["Full flow test: register → onboarding → buat kelas → import siswa → Full AI modul → jurnal → absensi → nilai → deskripsi → bukti PMM", "Free tier test: semua locked feature tampilkan upgrade prompt yang benar", "Go tier test: quota habis → 429 → top-up CTA", "Plus tier test: semua fitur berjalan tanpa limit", "Performance test: Full AI generation < 60s, describe grades < 30s", "Mobile test semua screen di HP Android real", "Deploy Phase 3 ke staging + smoke test"], output: "Phase 3 complete. Semua tier behavior benar. AI generation dalam target waktu.", blocker: "Test di kondisi jaringan buruk (throttle ke 3G) untuk offline mode." },
    ],
  },
  {
    week: "Week 7", phase: "Phase 4 — Versioning & Migration", color: "#F97316",
    days: [
      { day: "Day 31", focus: "Kurikulum Versioning — Admin Side", tasks: ["Admin: CRUD CurriculumVersion lengkap dengan status management", "Admin: ModuleTemplate schema editor (JSON editor CodeMirror lite)", "Admin: migration_rules editor dengan validasi struktur JSON", "Admin: tombol [Publish Version] + konfirmasi dialog + preview diff impact", "Seed: tambah Kurikulum Merdeka 2025 (jika ada) sebagai contoh migration workflow"], output: "Admin bisa create dan publish curriculum version baru.", blocker: "JSON editor harus validate structure migration_rules sebelum save." },
      { day: "Day 32", focus: "Edge Function Auto-Migrate", tasks: ["supabase/functions/auto-migrate/index.ts", "Input: { from_version_id, to_version_id, migration_rules }", "Query modules WHERE curriculum_version_id = from_id LIMIT 50", "Apply: rename fields (field_map), set defaults (new_required), flag deprecated (prefix _deprecated_)", "Generate diff JSONB: { added, changed, removed, needs_input }", "INSERT module_migrations { status: pending_review, diff }", "Batch loop: fetch 50 berikutnya sampai selesai", "Partial failure safe: catch per modul, log, lanjut", "Return report: { success: N, failed: M, failed_module_ids: [] }"], output: "Edge Function auto-migrate berjalan. module_migrations terisi dengan diff yang benar.", blocker: "Test dengan 100+ modul di staging — verifikasi tidak ada DB lock." },
      { day: "Day 33", focus: "Migration Diff Review UI", tasks: ["app/(app)/modules/[id]/migration/page.tsx", "Banner: 'Kurikulum [nama] tersedia — review perubahan'", "Per field: before (abu strikethrough) / after (hijau) — side-by-side desktop, stacked mobile", "Tags: BERUBAH (amber) / BARU (green) / DIHAPUS (red) / PERLU DIISI (red + ⚠️)", "Inline input untuk PERLU DIISI dengan validasi wajib sebelum bisa accept", "Sticky bottom: [Tolak — Tetap versi lama] [Terima & Simpan] + konfirmasi dialog", "Setelah accept: UPDATE modules SET content + curriculum_version_id"], output: "Guru bisa review diff, isi field baru, accept atau tolak migrasi.", blocker: "needs_input validation di backend juga — jangan hanya frontend." },
      { day: "Day 34", focus: "Migration Notification + Phase 4 Polish", tasks: ["Setelah Edge Function selesai: INSERT notifications per affected user", "Email batch via Resend: template migration_ready", "Batch email: rate limit 10 emails/detik, jangan kirim semua sekaligus", "Dashboard stat card 'Perlu Update': count pending_review migrations", "Banner di dashboard: 'X modul perlu review untuk Kurikulum [nama]'", "Full test skenario: field renamed, field baru required, field deprecated", "Test tolak migrasi, test terima migrasi, test partial failure Edge Function"], output: "Full migration flow berjalan. Email terkirim. Semua skenario ter-handle.", blocker: "Edge case: guru tolak migrasi — jangan di-notify terus-menerus." },
      { day: "Day 35", focus: "CI/CD Hardening + Staging Deploy", tasks: ["GitHub Actions: tambah supabase db push ke staging di CI pipeline", "pnpm audit di CI: block deploy kalau ada critical vulnerability", "Renovate Bot: setup config (auto-merge patch, manual review minor/major, weekly schedule)", "Test rollback: bisa revert deployment Railway dan Vercel kalau ada issue", "Full regression di staging: semua Phase 0-4 features berjalan", "Performance audit: Lighthouse semua halaman penting, fix LCP yang > 2.5s"], output: "CI/CD hardened. Rollback procedure tested. Staging fully functional.", blocker: "Renovate harus dikonfig dengan benar — jangan auto-merge semua atau terlalu banyak PRs." },
    ],
  },
  {
    week: "Week 8", phase: "Phase 5 — Billing & Export", color: "#EF4444",
    days: [
      { day: "Day 36", focus: "Xendit Integration + Checkout Flow", tasks: ["Daftar Xendit business account (siapkan dokumen: KTP, NPWP, akta — submit ASAP, verification 2-3 hari)", "Install xendit-node SDK di Elysia", "Setup payment methods: QRIS, GoPay, OVO, Dana, ShopeePay, VA BCA/Mandiri/BNI, Indomaret/Alfamart", "POST /billing/checkout { plan, billing_cycle } → create Xendit invoice → return payment_url", "Checkout UI: pilih plan → pilih billing cycle → pilih payment method → redirect ke Xendit", "Test di Xendit sandbox: semua payment methods", "Top-up flow: POST /billing/topup → Xendit one-time payment link Rp 5.000"], output: "Checkout flow berjalan di sandbox. Payment URL terbuka.", blocker: "Xendit business verification butuh 2-3 hari — JANGAN tunggu minggu ini. Submit dokumen di Day 1." },
      { day: "Day 37", focus: "Xendit Webhook Handler", tasks: ["POST /webhooks/xendit — verify X-CALLBACK-TOKEN header dulu", "Return 200 ke Xendit DULU, proses logic SETELAH", "payment.paid → subscription active, reset quota, kirim email payment_success + invoice PDF", "payment.expired/failed → past_due, set grace_period_end = now + 3 hari, kirim email", "topup payment.paid → ai_quota_limit += 3, INSERT topups", "Idempotency: cek xendit_payment_id UNIQUE sebelum proses", "Log semua webhook ke webhook_logs table", "Test via Xendit dashboard 'Send Test Webhook' untuk semua event types"], output: "Webhook handler berjalan. payment.paid → active dalam < 5 detik.", blocker: "Concurrent webhook untuk event yang sama → idempotency check wajib." },
      { day: "Day 38", focus: "Dunning + Subscription Lifecycle", tasks: ["Cron: quota_reset (1st monthly 00.00 WIB)", "Cron: subscription_expiry_check (daily 09.00 WIB)", "Cron: grace_period_check (daily 08.00 WIB) — suspend kalau expired", "Cron: subscription_expiring_notify (daily 10.00 WIB — 7 hari sebelum expired)", "Cron: storage_cleanup (daily 02.00 — delete exports > 7 hari, invoices backup > 90 hari)", "Dunning emails: Day 0, Day 1, Day 3, Day 7 via Resend", "Billing middleware: cek grace period di semua request yang butuh subscription", "Self-serve cancel: POST /billing/cancel → cancel_at_period_end=true", "Self-serve reactivate: POST /billing/reactivate"], output: "Dunning otomatis berjalan. Cancel dan reactivate self-serve berjalan.", blocker: "Test dengan subscription yang sengaja dibuat past_due di sandbox." },
      { day: "Day 39", focus: "Invoice PDF + Billing Page", tasks: ["Install @react-pdf/renderer di Elysia", "Invoice template: logo PT, NPWP PT, detail layanan, subtotal, PPN 11%, TOTAL, status LUNAS", "invoice_sequences: auto-increment per tahun → INV-2025-000001", "Generate saat payment.paid → upload ke Supabase Storage private invoices/", "Signed URL 30 hari → payments.invoice_url", "Kirim via Resend email payment_success", "app/(app)/settings/billing/page.tsx — plan, quota bar, riwayat bayar, [+ Top-up], [Download Invoice]", "School plan: input NPWP sekolah untuk invoice BOS"], output: "Invoice PDF generated dan terkirim via email. Billing page berjalan.", blocker: "React-PDF render di Bun: test compatibility dulu sebelum integrasi penuh." },
      { day: "Day 40", focus: "Modul Export PDF + Email Templates", tasks: ["Install Puppeteer (atau @sparticuz/chromium untuk Railway)", "HTML template modul: A4, Times New Roman 12pt, header mapel+fase+kelas, footer nomor halaman", "Free tier: diagonal watermark CSS overlay opacity 15%", "Sekolah plan: logo sekolah di header", "Upload ke Storage exports/ private, signed URL 7 hari, auto-delete lifecycle rule", "Upgrade prompt component: slide-up sheet untuk free user saat klik download", "8 email templates React Email: welcome, payment_success, payment_failed, subscription_expiring, migration_ready, quota_warning, export_ready, school_invite", "Test semua email di Gmail + Outlook mobile (rendering sangat berbeda)"], output: "PDF export berjalan. Watermark free tier. 8 email templates terkirim bagus di semua client.", blocker: "Puppeteer butuh extra RAM di Railway — set 512MB minimum, monitor setelah launch." },
    ],
  },
  {
    week: "Week 9", phase: "Phase 6 — Multi-tenant & School Plan", color: "#0EA5E9",
    days: [
      { day: "Day 41", focus: "School Plan — Kepala Sekolah Dashboard", tasks: ["Middleware: kepala_sekolah role check untuk /school/* routes", "app/(app)/school/dashboard — semua guru + status modul + compliance kurikulum", "Compliance report: berapa guru yang sudah buat modul untuk kurikulum aktif semester ini", "Rekap PKG semua guru: list guru + link ke bukti kinerja masing-masing", "POST /school/invite { email } → generate invite token (expire 48 jam) → kirim email school_invite", "Accept invite: /join?token=xxx → verify token → add user ke school + set role guru", "Upload master jadwal sekolah: Excel → parse → assign jadwal ke guru yang tepat"], output: "Kepala sekolah bisa invite guru dan monitor compliance.", blocker: "Invite token harus expire — simpan di DB dengan expired_at, hapus setelah dipakai." },
      { day: "Day 42", focus: "Landing Page + SEO", tasks: ["app/(marketing)/page.tsx — hero, social proof counter, how it works, feature showcase, pricing, FAQ, footer", "Counter: total modul dibuat (real-time Supabase, revalidate 1 jam)", "Pricing section: toggle bulanan/tahunan, 4 tier dengan feature comparison", "FAQ accordion (12 pertanyaan) — schema.org FAQPage markup", "next-sitemap: sitemap.xml otomatis", "robots.txt: disallow /dashboard, /admin, /api, /settings", "Blog MDX: minimal 2 artikel sebelum launch ('Cara buat modul Kurikulum Merdeka', 'PMM dan bukti kinerja')", "Lighthouse landing: target LCP < 2s"], output: "Landing page live dan fast. Sitemap tersubmit ke Search Console.", blocker: "Jangan terlalu banyak animasi di landing — prioritas performance." },
      { day: "Day 43", focus: "Help Center + Subdomain Routing", tasks: ["app/(marketing)/help/ — 15 artikel MDX minimum: cara buat modul, jurnal, nilai, bayar, PMM bukti kinerja, dll", "Client-side search Fuse.js di help center", "Per-artikel feedback: thumb up/down → INSERT feedbacks", "Next.js middleware.ts: extract subdomain dari hostname → inject x-school-subdomain header", "Vercel wildcard domain: *.modulajar.app (butuh Vercel Pro)", "School layout: baca x-school-subdomain header → query school → tampilkan logo+nama sekolah", "Test subdomain: sma1test.modulajar.app → menampilkan branding sekolah"], output: "Help center live. Subdomain routing berjalan untuk school plan.", blocker: "Vercel wildcard domain butuh Pro plan — upgrade sekarang kalau belum." },
      { day: "Day 44", focus: "Public Modul Share + Changelog", tasks: ["app/m/[slug]/page.tsx — semua sections expandable, OG image dynamic via @vercel/og", "Schema.org Article markup, sidebar CTA signup", "Changelog MDX: apps/web/content/changelog/*.mdx", "In-app changelog: app/(app)/settings/changelog — list update, badge unread di navbar", "Mark as read: set localStorage key saat halaman dibuka", "Feature flags admin toggle: app/(admin)/flags", "Maintenance mode: app_config toggle → Next.js middleware intercept → maintenance page", "Maintenance page: auto-refresh 30 detik, link ke status.modulajar.app"], output: "Public share page live dengan OG. Changelog in-app berjalan. Feature flags ter-toggle.", blocker: "OG image generation bisa lambat — cache dengan vercel edge config." },
      { day: "Day 45", focus: "Launch Checklist + Production Deploy", tasks: ["Jalankan semua 60 item launch checklist — fix yang belum hijau", "Supabase production: push semua migrations, seed CP data + ModuleTemplate + 25 curated modules", "Railway production: verify env vars, health check hijau", "Vercel production: custom domain, SSL, build sukses", "Betterstack: verify semua monitors aktif, test alert", "Final smoke test production: register → buat kelas → import siswa → Full AI modul → jurnal → absensi → nilai → deskripsi → bukti PMM → bayar → download PDF → invoice terkirim", "LAUNCH 🚀 (Selasa atau Rabu pagi — jangan Jumat)"], output: "modulajar.app live di production. Semua systems go.", blocker: "Jangan launch Jumat sore. Kalau ada issue kritis, tidak bisa fix over weekend." },
    ],
  },
  {
    week: "Week 10", phase: "Post-Launch — Stabilize & Grow", color: "#84CC16",
    days: [
      { day: "Day 46-47", focus: "Bug Fix Sprint", tasks: ["Monitor Sentry 24/7 selama 48 jam pertama", "Fix semua P0 error dalam 4 jam, P1 dalam 24 jam", "Monitor Railway RAM (Puppeteer) dan CPU", "Respond semua email support dalam 1 hari kerja", "Daily metrics check: signup rate, activation rate, AI cost"], output: "Production stabil. Error rate < 0.1%.", blocker: "Jangan tambah fitur baru selama stabilization sprint." },
      { day: "Day 48-50", focus: "First User Feedback + Community", tasks: ["Call 10 guru early adopter: 15 menit, tanyakan friction terbesar", "Review Posthog funnel: di mana user drop off?", "Posting di grup Facebook Guru Indonesia (jutaan member)", "MGMP/KKG outreach: hubungi ketua MGMP per kota, tawarkan demo", "Submit ke Google Search Console, verify sitemap", "Email weekly digest pertama ke semua registered users", "NPS survey untuk user yang sudah publish 3+ modul"], output: "First 100 registered users. First paying customer. Backlog ter-prioritasi dari real feedback.", blocker: "Jangan assume kebutuhan user — tanya langsung." },
    ],
  },
];

// ─── ANTI-DRIFT RULES ─────────────────────────────────────────────────────────
const ANTI_DRIFT = [
  {
    cat: "Pricing — Never Change Without Updating This Doc",
    color: "#EF4444",
    rules: [
      "FREE: Rp 0 — 2 modul/bln (preview), no PDF download, no jurnal/nilai/absensi",
      "GO: Rp 49.000/bln (Rp 490.000/thn) — 10 Full AI (gpt-4o-mini), jurnal, absensi, nilai, 5 deskripsi batch/bln, download PDF",
      "PLUS: Rp 99.000/bln (Rp 990.000/thn) — 20 Full AI (gpt-4o-mini), Prota/Promes, Bank Soal, Bukti PMM, Kop Surat Sekolah",
      "SEKOLAH: Rp 79.000/guru/bln MIN 6 GURU — 25 modul/guru/bln (gpt-4o-mini, margin ~75%), dashboard kepsek, master kop surat, invoice BOS",
      "TOP-UP: Rp 10.000 = +3 modul Full AI (semua tier)",
      "AI COST: gpt-4o-mini ~Rp 500-800/modul. Margin Go: ~84%. Plus: ~84% (20 modul). Sekolah: ~75% (25 modul/guru).",
    ],
  },
  {
    cat: "Positioning — Anti-Compete Pemerintah",
    color: "#F97316",
    rules: [
      "BUKAN pengganti PMM (Platform Merdeka Mengajar) — PMM adalah kewajiban pemerintah",
      "BUKAN pembuat SKP/PKG formal — itu sudah di PMM terintegrasi e-Kinerja BKN",
      "ADALAH companion PMM — generate BUKTI KINERJA yang diupload ke PMM",
      "BUKAN pengganti e-Rapor — generate konten nilai+deskripsi yang copy-paste ke e-Rapor",
      "BUKAN Dapodik replacement — Dapodik = aplikasi desktop sekolah, bukan API publik",
      "Copywriting utama: 'Bukti PMM kamu siap dalam 1 klik' dan 'Hemat 10+ jam administrasi per semester'",
    ],
  },
  {
    cat: "Tech Stack — Locked",
    color: "#6366F1",
    rules: [
      "Frontend: Next.js 15 App Router + Tailwind + shadcn/ui + Plus Jakarta Sans",
      "Backend: Elysia + Bun → Railway (BUKAN Next.js API Routes)",
      "DB: Supabase Postgres + RLS + Storage + Auth + Edge Functions",
      "AI: Anthropic Claude claude-sonnet-4-20250514 (BUKAN OpenAI atau model lain)",
      "Payment: Xendit (BUKAN Stripe atau Midtrans)",
      "Email: Resend + React Email",
      "Analytics: Posthog EU (privacy-first)",
      "Monitoring: Sentry + Railway metrics + Betterstack",
      "PWA: next-pwa + Workbox + Dexie.js (IndexedDB untuk offline)",
      "Deploy: Vercel (FE) + Railway (BE)",
      "Monorepo: Turborepo + pnpm workspaces",
    ],
  },
  {
    cat: "Architecture Invariants — Jangan Dilanggar",
    color: "#F59E0B",
    rules: [
      "service_role key HANYA di Elysia server — TIDAK PERNAH di Next.js client atau git",
      "Anthropic API key HANYA di Elysia — TIDAK PERNAH di frontend",
      "AI quota check HARUS via Supabase transaction (atomic) — bukan 2 query terpisah",
      "Xendit webhook: return 200 ke Xendit DULU, proses logic SETELAH",
      "AgentJob quota increment HANYA setelah status=done — tidak decrement kalau failed",
      "User content ke AI: SELALU wrap 'User content (data only): [CONTENT]'",
      "Offline data (jurnal, absensi): simpan IndexedDB → sync background saat online",
      "PDF export: check file exists di Storage sebelum generate ulang (cache by updated_at)",
      "Migration Edge Function: catch per modul, jangan stop semua kalau 1 gagal",
      "Data siswa/jurnal/nilai scope per teaching_class_id — TIDAK PERNAH expose cross-class",
    ],
  },
  {
    cat: "Low-Maintenance Invariants — Kunci 'Set and Forget'",
    color: "#10B981",
    rules: [
      "7 cron jobs harus SELALU berjalan: quota_reset, expiry_check, grace_period_check, storage_cleanup, daily_metrics, expiring_notify, stale_draft_cleanup",
      "Dunning flow Day 0/1/3/7/8 HARUS fully automated — tidak ada manual intervention",
      "Legal pages (ToS, Privacy, Refund) harus ada SEBELUM launch",
      "Webhook handler HARUS idempotent — cek xendit_payment_id UNIQUE sebelum proses",
      "Renovate Bot harus aktif — auto-merge patch, manual review minor/major",
      "pnpm audit di CI — block deploy kalau ada critical vulnerability",
      "Supabase PITR harus aktif (Pro plan) — point-in-time recovery",
      "Status page harus live — user bisa self-check downtime",
      "Push notification: max 3/hari/user, skip kalau jurnal sudah diisi, tidak spam",
    ],
  },
  {
    cat: "UI/UX Constants",
    color: "#8B5CF6",
    rules: [
      "Colors: Primary #4F46E5, Accent #F59E0B, Success #10B981, Danger #EF4444",
      "Tier badges: Free #475569, Go #4F46E5, Plus #F59E0B, Sekolah #10B981",
      "Font: Plus Jakarta Sans (UI), DM Mono (kode, label teknis)",
      "Autosave debounce: 2000ms — jangan lebih pendek (too many requests)",
      "Upgrade prompt: SELALU slide-up sheet — TIDAK PERNAH redirect atau popup modal",
      "Bahasa: Indonesia — 'kamu' bukan 'Anda', error messages helpful bukan teknis",
      "Timezone: display dalam WIB (Asia/Jakarta), simpan DB dalam UTC",
      "Currency: Rp 49.000 (titik ribuan, tanpa desimal)",
      "Jurnal form: HARUS bisa diisi dalam 60 detik di HP — minimal field only, detail expandable",
    ],
  },
];

// ─── LAUNCH CHECKLIST ─────────────────────────────────────────────────────────
const CHECKLIST = [
  { group: "Legal & Compliance", color: "#F59E0B", items: ["Terms of Service live di /terms", "Privacy Policy live di /privacy (UU PDP Indonesia)", "Refund policy live di /refund", "Cookie Policy live di /cookies", "ToS checkbox wajib di register form", "PPN 11% disclosed di checkout", "Auto-renewal disclosed di checkout", "Cookie consent banner (opt-out analytics)", "Account deletion self-serve berjalan (30 hari soft delete)", "Data export self-serve berjalan (ZIP via email)"] },
  { group: "Security", color: "#EF4444", items: ["Security headers di next.config.ts (CSP, HSTS, X-Frame-Options, dll)", "Zod validation semua Elysia endpoints", "DOMPurify sanitize Tiptap content", "CORS Elysia hanya allow modulajar.app + *.modulajar.app", "Semua API keys di Railway/Vercel env vars (BUKAN di git)", "Supabase service_role TIDAK terexpose ke client bundle", "Xendit webhook signature verification live", "Email verification wajib sebelum akses app", "pnpm audit: tidak ada critical vulnerability"] },
  { group: "Infrastructure", color: "#6366F1", items: ["Supabase PITR aktif (Pro plan)", "Weekly backup cron berjalan", "Semua database indexes terpasang", "Railway health check /health returns 200", "Sentry error tracking berjalan (Next.js + Elysia)", "Status page live di status.modulajar.app", "SSL semua domain valid (modulajar.app, api, status, *.modulajar.app)", "Renovate Bot aktif di repo"] },
  { group: "Billing & Automation", color: "#EC4899", items: ["Xendit business account verified (submit dokumen di Day 1!)", "Semua 7 cron jobs berjalan di staging", "Webhook handler live dan tested semua event types", "Grace period flow tested (Day 0→1→3→7→8)", "Invoice PDF generated dan terkirim via email tested", "Top-up flow tested (Xendit payment link Rp 5.000)", "Cancel dan reactivate self-serve tested", "Dunning email sequence semua 5 emails tested"] },
  { group: "Product — Core", color: "#8B5CF6", items: ["Full AI modul end-to-end tested (< 60 detik)", "Scratch + AI Assist semua 4 mode tested", "Jurnal + absensi offline mode tested (airplane mode)", "Push notification muncul 30 menit setelah kelas selesai", "Import Excel siswa tested (format berbeda)", "Input nilai + rekap KKTP tested", "Deskripsi nilai AI tested", "Paket Bukti PMM ZIP tested", "PDF export tested (clean + watermark)", "Migration diff review tested (3 skenario)"] },
  { group: "Product — Upgrade Flow", color: "#F97316", items: ["Free → upgrade prompt muncul saat: klik download, klik Full AI, klik jurnal, klik nilai", "Go → top-up prompt muncul saat quota habis", "Billing page: plan, quota bar, riwayat, download invoice berjalan", "Checkout semua payment method di sandbox (QRIS, GoPay, VA, Indomaret)"] },
  { group: "SEO & Analytics", color: "#10B981", items: ["Landing page live (hero, pricing, FAQ, footer)", "sitemap.xml generated dan valid", "robots.txt live", "OG images semua halaman utama bagus saat dishare ke WA", "Posthog tracking aktif dengan opt-out banner", "Semua 10+ key events terpasang di Posthog", "Lighthouse landing: LCP < 2.5s", "2+ blog articles live sebelum launch", "Google Search Console: submit sitemap"] },
  { group: "Seed Data & Content", color: "#84CC16", items: ["CP Kurikulum Merdeka semua mapel Fase A-F seeded", "ModuleTemplate untuk Kurikulum Merdeka seeded", "25+ curated modules di library (reviewed manual)", "15+ help center articles live", "academic_year Ganjil 2025/2026 seeded sebagai active"] },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Badge = ({ label, color, bg }) => (
  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: bg || "#1E293B", color: color || "#94A3B8", letterSpacing: 0.5, whiteSpace: "nowrap", flexShrink: 0 }}>{label}</span>
);
const tick = (val) => {
  if (val === true) return <span style={{ color: "#10B981", fontWeight: 700 }}>✓</span>;
  if (val === false) return <span style={{ color: "#EF4444" }}>✗</span>;
  return <span style={{ color: "#F59E0B", fontSize: 11 }}>{val}</span>;
};

export default function App() {
  const [tab, setTab] = useState("roadmap");
  const [xD, setXD] = useState(null);
  const [xS, setXS] = useState(null);
  const [xW, setXW] = useState("Week 1");
  const [xDay, setXDay] = useState(null);
  const [xDrift, setXDrift] = useState(null);
  const [xCheck, setXCheck] = useState({});
  const [done, setDone] = useState({});

  const totalDays = ROADMAP.reduce((a, w) => a + w.days.length, 0);
  const doneCount = Object.values(done).filter(Boolean).length;
  const totalCheckItems = CHECKLIST.reduce((a, g) => a + g.items.length, 0);
  const checkedItems = Object.values(xCheck).filter(Boolean).length;

  const tabs = [
    { id: "roadmap", label: "📅 Daily Roadmap" },
    { id: "decisions", label: "📋 Decisions (16)" },
    { id: "schema", label: "🗄️ Schema" },
    { id: "features", label: "✨ Feature Map" },
    { id: "antidrift", label: "🔒 Anti-Drift" },
    { id: "checklist", label: "🚀 Launch Checklist" },
    { id: "ssot", label: "💡 SSOT" },
  ];

  const C = { background: "#161B27", border: "1px solid #21293A", borderRadius: 12, overflow: "hidden", marginBottom: 8 };
  const row = { width: "100%", padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between" };
  const ST = { fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6, marginTop: 12 };
  const IT = { fontSize: 12, color: "#7A8A9E", marginBottom: 6, display: "flex", gap: 8, lineHeight: 1.65 };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0D1117", color: "#E2E8F0", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "16px 16px 0", background: "#080C14", borderBottom: "1px solid #161B27" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ background: "linear-gradient(135deg,#4338CA,#7C3AED)", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>📚</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#F1F5F9", letterSpacing: -0.5 }}>modulajar.app</div>
              <div style={{ fontSize: 9, color: "#1E293B", letterSpacing: 2, fontFamily: "'DM Mono',monospace" }}>MASTER SPEC v2.0 · RESEARCH-BASED · ANTI-DRIFT · DAILY ROADMAP</div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, background: "#0A2918", color: "#10B981", padding: "3px 8px", borderRadius: 6 }}>{doneCount}/{totalDays} days</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: "#2D1F06", color: "#F59E0B", padding: "3px 8px", borderRadius: 6 }}>Free/Go/Plus/Sekolah</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: "#1E1B4B", color: "#818CF8", padding: "3px 8px", borderRadius: 6 }}>16 ADRs</span>
            </div>
          </div>
          <div style={{ display: "flex", overflowX: "auto", gap: 0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 11, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "#818CF8" : "#334155", borderBottom: tab === t.id ? "2px solid #6366F1" : "2px solid transparent", whiteSpace: "nowrap", fontFamily: "inherit" }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 12px 60px" }}>

        {/* ROADMAP */}
        {tab === "roadmap" && <>
          <div style={{ background: "#161B27", borderRadius: 10, padding: "12px 16px", marginBottom: 12, border: "1px solid #21293A" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0" }}>Progress — {doneCount}/{totalDays} hari</span>
              <span style={{ fontSize: 11, color: "#334155", fontFamily: "'DM Mono',monospace" }}>{Math.round(doneCount/totalDays*100)}%</span>
            </div>
            <div style={{ background: "#1A2030", borderRadius: 99, height: 5 }}>
              <div style={{ background: "linear-gradient(90deg,#6366F1,#10B981)", height: "100%", width: `${doneCount/totalDays*100}%`, borderRadius: 99, transition: "width 0.3s" }} />
            </div>
          </div>
          {ROADMAP.map(week => (
            <div key={week.week} style={{ ...C, borderLeft: `3px solid ${week.color}` }}>
              <button style={row} onClick={() => setXW(xW === week.week ? null : week.week)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: week.color }}>{week.week}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#E2E8F0" }}>{week.phase.split(" — ")[1]}</span>
                  <span style={{ fontSize: 10, color: "#334155" }}>{week.days.length} hari</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#334155", fontFamily: "'DM Mono',monospace" }}>{week.days.filter(d => done[d.day]).length}/{week.days.length}</span>
                  <span style={{ color: week.color, fontSize: 18 }}>{xW === week.week ? "−" : "+"}</span>
                </div>
              </button>
              {xW === week.week && (
                <div style={{ borderTop: "1px solid #1A2030" }}>
                  {week.days.map(d => (
                    <div key={d.day} style={{ borderBottom: "1px solid #111827" }}>
                      <button style={{ ...row, padding: "10px 16px", background: done[d.day] ? "#0A1F12" : "#111827" }} onClick={() => setXDay(xDay === d.day ? null : d.day)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button onClick={e => { e.stopPropagation(); setDone(p => ({ ...p, [d.day]: !p[d.day] })); }} style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${done[d.day] ? "#10B981" : "#21293A"}`, background: done[d.day] ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: 9, color: "white", fontWeight: 700 }}>
                            {done[d.day] ? "✓" : ""}
                          </button>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: week.color, minWidth: 44 }}>{d.day}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: done[d.day] ? "#334155" : "#B0BEC5" }}>{d.focus}</span>
                        </div>
                        <span style={{ color: "#334155", fontSize: 14 }}>{xDay === d.day ? "−" : "+"}</span>
                      </button>
                      {xDay === d.day && (
                        <div style={{ padding: "10px 16px 14px 44px", background: "#0D1117" }}>
                          <div style={ST}>Tasks ({d.tasks.length})</div>
                          {d.tasks.map((t, i) => <div key={i} style={IT}><span style={{ color: week.color, flexShrink: 0, fontFamily: "'DM Mono',monospace", fontSize: 10, minWidth: 16 }}>{i+1}.</span><span>{t}</span></div>)}
                          <div style={ST}>Output Hari Ini</div>
                          <div style={{ fontSize: 12, color: "#10B981", background: "#0A2918", padding: "8px 10px", borderRadius: 6, lineHeight: 1.6 }}>✓ {d.output}</div>
                          <div style={ST}>Potential Blocker</div>
                          <div style={{ fontSize: 12, color: "#F59E0B", background: "#2D1F06", padding: "8px 10px", borderRadius: 6, lineHeight: 1.6 }}>⚠ {d.blocker}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>}

        {/* DECISIONS */}
        {tab === "decisions" && <>
          <p style={{ color: "#334155", fontSize: 12, margin: "0 0 12px" }}>16 ADR berbasis research. Termasuk 8 keputusan baru dari deep research Dapodik, PMM, format nilai Kurikulum Merdeka.</p>
          {DECISIONS.map(d => (
            <div key={d.id} style={C}>
              <button style={row} onClick={() => setXD(xD === d.id ? null : d.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#2D3A4E" }}>{d.id}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#E2E8F0" }}>{d.title}</span>
                  <Badge label="✓ Accepted" color="#10B981" bg="#0A2918" />
                </div>
                <span style={{ color: "#6366F1", fontSize: 18, marginLeft: 10, flexShrink: 0 }}>{xD === d.id ? "−" : "+"}</span>
              </button>
              {xD === d.id && <div style={{ borderTop: "1px solid #1A2030", padding: "12px 16px" }}>
                <div style={ST}>Decision</div>
                <p style={{ fontSize: 12, color: "#B0BEC5", lineHeight: 1.7, margin: "0 0 4px" }}>{d.decision}</p>
                <div style={ST}>Reason</div>
                <p style={{ fontSize: 12, color: "#7A8A9E", lineHeight: 1.7, margin: "0 0 4px" }}>{d.reason}</p>
                <div style={ST}>Impact</div>
                {d.impact.map((i, idx) => <div key={idx} style={IT}><span style={{ color: "#4F46E5" }}>→</span>{i}</div>)}
              </div>}
            </div>
          ))}
        </>}

        {/* SCHEMA */}
        {tab === "schema" && <>
          <p style={{ color: "#334155", fontSize: 12, margin: "0 0 12px" }}>7 domain. 25+ tabel. Includes tabel baru: academic_years, teaching_classes, students, journals, attendances, grade_entries, grade_summaries, questions, question_sets.</p>
          {SCHEMA.map(domain => (
            <div key={domain.domain} style={{ ...C, borderLeft: `3px solid ${domain.color}` }}>
              <button style={row} onClick={() => setXS(xS === domain.domain ? null : domain.domain)}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#E2E8F0" }}>{domain.domain}</span>
                <span style={{ color: domain.color, fontSize: 18 }}>{xS === domain.domain ? "−" : "+"}</span>
              </button>
              {xS === domain.domain && <div style={{ borderTop: "1px solid #1A2030", padding: "12px 16px" }}>
                {domain.tables.map(t => (
                  <div key={t.name} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: domain.color, fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>{t.name}</div>
                    {t.fields.map((f, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#7A8A9E", fontFamily: "'DM Mono',monospace", background: "#111827", padding: "3px 8px", borderRadius: 4, marginBottom: 3 }}>{f}</div>
                    ))}
                  </div>
                ))}
              </div>}
            </div>
          ))}
        </>}

        {/* FEATURE MAP */}
        {tab === "features" && <>
          <p style={{ color: "#334155", fontSize: 12, margin: "0 0 12px" }}>Semua fitur per tier. Free / Go Rp 49rb / Plus Rp 99rb / Sekolah Rp 699rb.</p>
          {FEATURES.map(cat => (
            <div key={cat.category} style={{ ...C, marginBottom: 12 }}>
              <div style={{ padding: "10px 16px", background: "#111827", borderBottom: "1px solid #1A2030" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: "#E2E8F0" }}>{cat.category}</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1A2030" }}>
                      <th style={{ padding: "8px 16px", textAlign: "left", color: "#334155", fontWeight: 600, fontSize: 11, minWidth: 200 }}>Fitur</th>
                      {["Free", "Go", "Plus", "Sekolah"].map(p => <th key={p} style={{ padding: "8px 12px", textAlign: "center", color: PRICING[p.toLowerCase()]?.color || "#475569", fontWeight: 700, fontSize: 11, minWidth: 70 }}>{p}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {cat.items.map(item => (
                      <tr key={item.name} style={{ borderBottom: "1px solid #111827" }}>
                        <td style={{ padding: "8px 16px", color: "#94A3B8" }}>{item.name}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>{tick(item.free)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>{tick(item.go)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>{tick(item.plus)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>{tick(item.sekolah)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>}

        {/* ANTI-DRIFT */}
        {tab === "antidrift" && <>
          <div style={{ background: "#1A0A0A", border: "1px solid #3D1515", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#EF4444", marginBottom: 4 }}>⚠️ Anti-Drift Protocol</div>
            <div style={{ fontSize: 12, color: "#7A1515", lineHeight: 1.7 }}>Doc ini adalah Single Source of Truth. Setiap keputusan yang bertentangan dengan rules di bawah butuh ADR baru yang explicit. Jangan drift diam-diam.</div>
          </div>
          {ANTI_DRIFT.map(s => (
            <div key={s.cat} style={{ ...C, borderLeft: `3px solid ${s.color}` }}>
              <button style={row} onClick={() => setXDrift(xDrift === s.cat ? null : s.cat)}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#E2E8F0" }}>{s.cat}</span>
                <span style={{ color: s.color, fontSize: 18 }}>{xDrift === s.cat ? "−" : "+"}</span>
              </button>
              {xDrift === s.cat && <div style={{ borderTop: "1px solid #1A2030", padding: "12px 16px" }}>
                {s.rules.map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#7A8A9E", marginBottom: 8, display: "flex", gap: 8, padding: "6px 10px", background: "#111827", borderRadius: 6, borderLeft: `2px solid ${s.color}44`, lineHeight: 1.65 }}>
                    <span style={{ color: s.color, flexShrink: 0, fontWeight: 700 }}>→</span>{r}
                  </div>
                ))}
              </div>}
            </div>
          ))}
        </>}

        {/* LAUNCH CHECKLIST */}
        {tab === "checklist" && <>
          <div style={{ background: "#161B27", borderRadius: 10, padding: "12px 16px", marginBottom: 12, border: "1px solid #21293A" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0" }}>Launch Readiness — {checkedItems}/{totalCheckItems} items</span>
              <span style={{ fontSize: 11, color: checkedItems === totalCheckItems ? "#10B981" : "#334155", fontFamily: "'DM Mono',monospace" }}>{Math.round(checkedItems/totalCheckItems*100)}%</span>
            </div>
            <div style={{ background: "#1A2030", borderRadius: 99, height: 5 }}>
              <div style={{ background: checkedItems === totalCheckItems ? "#10B981" : "#6366F1", height: "100%", width: `${checkedItems/totalCheckItems*100}%`, borderRadius: 99, transition: "width 0.3s" }} />
            </div>
          </div>
          {CHECKLIST.map(group => (
            <div key={group.group} style={{ ...C, borderLeft: `3px solid ${group.color}`, marginBottom: 10 }}>
              <div style={{ padding: "10px 16px", background: "#111827", borderBottom: "1px solid #1A2030", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: group.color }}>{group.group}</span>
                <span style={{ fontSize: 10, color: "#334155" }}>{group.items.filter((_, i) => xCheck[`${group.group}-${i}`]).length}/{group.items.length}</span>
              </div>
              <div style={{ padding: "10px 16px" }}>
                {group.items.map((item, i) => {
                  const key = `${group.group}-${i}`;
                  return (
                    <div key={i} onClick={() => setXCheck(p => ({ ...p, [key]: !p[key] }))} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start", cursor: "pointer" }}>
                      <div style={{ width: 15, height: 15, borderRadius: 3, border: `2px solid ${xCheck[key] ? group.color : "#21293A"}`, background: xCheck[key] ? group.color : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", fontWeight: 700 }}>
                        {xCheck[key] ? "✓" : ""}
                      </div>
                      <span style={{ fontSize: 12, color: xCheck[key] ? "#334155" : "#7A8A9E", lineHeight: 1.5, textDecoration: xCheck[key] ? "line-through" : "none" }}>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>}

        {/* SSOT */}
        {tab === "ssot" && <>
          <p style={{ color: "#334155", fontSize: 12, margin: "0 0 14px" }}>Single Source of Truth — pricing, stack, key numbers. Update di sini kalau ada perubahan.</p>
          {/* Pricing */}
          <div style={{ ...C, marginBottom: 12 }}>
            <div style={{ padding: "10px 16px", background: "#111827", borderBottom: "1px solid #1A2030" }}><span style={{ fontWeight: 700, fontSize: 12, color: "#F59E0B" }}>💰 Pricing</span></div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(PRICING).map(([key, p]) => (
                <div key={key} style={{ background: "#111827", borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${p.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 14, color: p.color }}>{p.label}</span>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginTop: 2 }}>{p.monthly === 0 ? "Gratis" : `Rp ${p.monthly.toLocaleString("id-ID")}/bln`}</div>
                      {p.yearly > 0 && <div style={{ fontSize: 10, color: "#334155" }}>Rp {p.yearly.toLocaleString("id-ID")}/thn (hemat 2 bln)</div>}
                    </div>
                    {key !== "free" && (
                      <div style={{ background: "#0A2918", borderRadius: 6, padding: "6px 10px", textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#334155" }}>AI Cost: Rp {AI_COST.per_module_idr.toLocaleString("id-ID")}/modul</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981" }}>Margin: {key === "go" ? "67%" : key === "plus" ? "~50% avg" : "85%"}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                    <span style={{ background: "#1A2130", color: "#475569", padding: "2px 8px", borderRadius: 6, fontSize: 10 }}>Full AI: {p.full_ai ? (p.ai_quota === -1 ? "Unlimited" : `${p.ai_quota}/bln`) : "Locked"}</span>
                    <span style={{ background: "#1A2130", color: "#475569", padding: "2px 8px", borderRadius: 6, fontSize: 10 }}>Download: {p.download ? "✓" : "✗"}</span>
                    {p.max_users && <span style={{ background: "#1A2130", color: "#475569", padding: "2px 8px", borderRadius: 6, fontSize: 10 }}>Max {p.max_users} users</span>}
                  </div>
                </div>
              ))}
              <div style={{ background: "#2D1F06", borderRadius: 8, padding: "10px 14px", border: "1px solid #F59E0B33" }}>
                <span style={{ fontWeight: 700, color: "#F59E0B", fontSize: 12 }}>Top-up: </span>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>Rp {TOPUP.price.toLocaleString("id-ID")} = +{TOPUP.credits} modul Full AI (Go only)</span>
              </div>
            </div>
          </div>
          {/* Stack */}
          <div style={C}>
            <div style={{ padding: "10px 16px", background: "#111827", borderBottom: "1px solid #1A2030" }}><span style={{ fontWeight: 700, fontSize: 12, color: "#6366F1" }}>🛠️ Tech Stack (Locked)</span></div>
            <div style={{ padding: "12px 16px" }}>
              {Object.entries(STACK).map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#334155", minWidth: 60, paddingTop: 2 }}>{k.toUpperCase()}</span>
                  <span style={{ fontSize: 12, color: "#7A8A9E" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Revenue Projection */}
          <div style={{ ...C, marginTop: 10 }}>
            <div style={{ padding: "10px 16px", background: "#111827", borderBottom: "1px solid #1A2030" }}><span style={{ fontWeight: 700, fontSize: 12, color: "#10B981" }}>📈 Revenue Projection</span></div>
            <div style={{ padding: "12px 16px" }}>
              {[
                { label: "Konservatif (12 bln)", go: 1500, plus: 800, sekolah: 40, color: "#475569" },
                { label: "Moderate (18-24 bln)", go: 5000, plus: 3000, sekolah: 150, color: "#6366F1" },
                { label: "Optimis (3 thn)", go: 15000, plus: 10000, sekolah: 500, color: "#10B981" },
              ].map(s => {
                const mrr = s.go * 49000 + s.plus * 99000 + s.sekolah * 700000; // Sekolah avg 10 guru × 70rb
                return (
                  <div key={s.label} style={{ background: "#111827", borderRadius: 8, padding: "10px 12px", marginBottom: 8, borderLeft: `2px solid ${s.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#F1F5F9", fontFamily: "'DM Mono',monospace" }}>MRR Rp {(mrr/1000000).toFixed(0)}jt</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#334155", marginTop: 3 }}>{s.go.toLocaleString("id-ID")} Go + {s.plus.toLocaleString("id-ID")} Plus + {s.sekolah} Sekolah → ARR ~Rp {((mrr*12)/1000000000).toFixed(1)}M</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>}

      </div>
    </div>
  );
}
