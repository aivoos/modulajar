import { useState } from "react";

const DECISIONS = [
  { id: "ADR-001", date: "2025-04-27", status: "accepted", title: "Elysia + Bun sebagai API server", context: "AI agent orchestration butuh persistent connection. Serverless (Vercel API Routes) tidak cocok karena cold start dan timeout limit 10–30 detik. Full AI mode bisa jalan 30–60 detik.", decision: "Gunakan Elysia + Bun di Railway sebagai dedicated API server. Next.js hanya untuk frontend dan tidak ada API Routes untuk logic bisnis.", consequences: ["SSE streaming dari agent berjalan smooth tanpa timeout", "Deploy split: Vercel (FE) + Railway (BE)", "Butuh CORS config antara dua domain", "Railway cost ~$5/bulan tambahan", "Type safety via Elysia Eden (mirip tRPC)"], alternatives: ["Next.js API Routes (serverless — timeout)", "Hono + Node.js", "Fastify + Node.js"] },
  { id: "ADR-002", date: "2025-04-27", status: "accepted", title: "Xendit sebagai payment gateway", context: "Target user guru Indonesia. Butuh QRIS, e-wallet lokal (GoPay/OVO/Dana), VA bank, retail outlet (Indomaret/Alfamart). Stripe tidak support metode lokal. Xendit juga bisa generate Invoice dengan NPWP untuk keperluan BOS.", decision: "Xendit satu-satunya payment processor. Webhook handler di Elysia. Invoice generate via Xendit + custom PDF layer di atas.", consequences: ["Coverage payment method Indonesia luas", "Invoice resmi untuk pertanggungjawaban BOS", "PPN 11% harus diperhitungkan untuk plan Sekolah", "Webhook handler harus idempotent", "Grace period 3 hari untuk past_due sebelum suspend"], alternatives: ["Stripe (tidak cocok untuk pasar Indonesia)", "Midtrans (opsi valid, tapi Xendit lebih developer-friendly)", "Doku"] },
  { id: "ADR-003", date: "2025-04-27", status: "accepted", title: "AI quota metering — bukan unlimited", context: "Claude Sonnet cost ~$0.10–0.30 per modul Full AI (6–7 agent calls). Guru Pro Rp 29.000 ≈ $1.75. Unlimited Full AI = margin negatif dari hari pertama.", decision: "Guru Pro: 10 modul Full AI/bulan. Top-up Rp 5.000 = +3 modul. Scratch + Assist tidak dicount quota karena cost per session ~$0.02.", consequences: ["Unit economics positif", "AgentJob.cost_idr harus dihitung dan dicatat tiap job", "Perlu UI quota bar yang jelas", "Top-up via Xendit payment link — one-time, bukan subscription"], alternatives: ["Unlimited (margin negatif)", "Per-call billing (terlalu kompleks untuk guru non-tech)", "Model lebih murah Haiku (kualitas output turun signifikan)"] },
  { id: "ADR-004", date: "2025-04-27", status: "accepted", title: "Free tier tidak bisa download PDF", context: "PDF adalah deliverable utama guru — dokumen yang diserahkan ke kepala sekolah dan diarsip sekolah. Ini adalah conversion lever paling kuat. Guru sudah invest waktu buat modul, tinggal 1 step lagi.", decision: "Free tier bisa buat dan preview modul di app, tapi download PDF terkunci. Upgrade prompt muncul saat klik download (slide-up sheet, bukan popup kasar).", consequences: ["Conversion free → paid harusnya tinggi", "Preview harus cukup bagus agar user betah di free tier", "Butuh watermark logic di export service", "Share link publik juga terkunci di free tier"], alternatives: ["Watermarked PDF di free tier (conversion lever melemah)", "Limit jumlah download (lebih kompleks)", "Semua bisa download (tidak ada conversion lever)"] },
  { id: "ADR-005", date: "2025-04-27", status: "accepted", title: "Monorepo dengan Turborepo + pnpm workspaces", context: "Ada 2 app (web + api) dan shared packages. Solo dev butuh DX yang smooth — type sharing end-to-end tanpa duplikasi, single git repo, satu PR untuk perubahan cross-layer.", decision: "Monorepo Turborepo. Packages: @modulajar/db (schema + types), @modulajar/agents (AI agent logic), @modulajar/shared (constants + utils).", consequences: ["Type safety end-to-end dari Supabase → Elysia → Next.js", "Build cache via Turborepo — CI lebih cepat", "pnpm workspace lebih efisien dari npm/yarn untuk monorepo", "Sedikit lebih complex setup awal tapi payoff jangka panjang"], alternatives: ["2 repo terpisah (type duplication, ribet)", "Single Next.js fullstack (timeout issue untuk AI)"] },
  { id: "ADR-006", date: "2025-04-27", status: "accepted", title: "Kurikulum versioning via schema-driven template", context: "Kurikulum Indonesia sering ganti (K13 → Merdeka → ?). Konten guru tidak boleh rusak saat kurikulum update. Butuh cara yang tidak require guru menulis ulang dari awal.", decision: "Module.content adalah JSONB driven by ModuleTemplate.schema. Saat kurikulum baru, migration_rules mendefinisikan field mapping. Auto-migrate via Edge Function, guru review diff sebelum confirm.", consequences: ["Guru tidak kehilangan konten saat kurikulum update", "Edge Function harus battle-tested — gagal = data corrupt", "migration_rules harus ditulis dengan sangat hati-hati oleh admin", "UI diff review kritis — harus jelas apa yang berubah"], alternatives: ["Hard-coded form per kurikulum (tidak scalable)", "Manual migration oleh guru (UX buruk)", "Versioned modules — copy baru tiap kurikulum (storage bloat)"] },
  { id: "ADR-007", date: "2025-04-27", status: "accepted", title: "Invoice PDF: React-PDF untuk billing, Puppeteer untuk modul export", context: "Dua kebutuhan berbeda: Invoice BOS (tabel structured, NPWP, PPN) vs Modul ajar export (rich text, format Kemendikbud). React-PDF ringan, Puppeteer full HTML fidelity.", decision: "React-PDF (@react-pdf/renderer) untuk invoice billing. Puppeteer untuk export modul ajar. Keduanya jalan di Elysia server, upload ke Supabase Storage, return signed URL.", consequences: ["Dua library berbeda untuk dua use case", "Puppeteer butuh lebih banyak RAM di Railway — monitor usage", "Signed URL expired 30 hari — setelah itu generate ulang", "File naming: invoices/INV-2025-001234.pdf, exports/module-{id}-{ts}.pdf"], alternatives: ["Satu library untuk keduanya (kompromi kualitas)", "Xendit Invoice native (kurang kontrol layout BOS)", "jsPDF (terlalu low-level)"] },
  { id: "ADR-008", date: "2025-04-27", status: "accepted", title: "Email: Resend + React Email", context: "Butuh transactional email: welcome, payment confirmation, migration alert, quota warning. Bahasa Indonesia. Harus reliable dan deliverable.", decision: "Resend sebagai email provider. React Email untuk template — bisa di-render sebagai HTML maupun preview di browser saat development.", consequences: ["Template bisa di-develop dan di-preview lokal", "Resend free tier: 3.000 email/bulan — cukup untuk early stage", "Kirim email dari Elysia service, bukan Next.js", "Domain verification harus setup di DNS modulajar.app"], alternatives: ["SendGrid (lebih mahal, overkill untuk early stage)", "Nodemailer + SMTP (reliability rendah)", "Supabase email (terlalu basic)"] },
  { id: "ADR-009", date: "2025-04-27", status: "pending", title: "Observability: Sentry + Railway Metrics", context: "Solo dev butuh tau kalau ada yang rusak tanpa harus mantengin dashboard terus-menerus. AI agent failure harus terdeteksi otomatis.", decision: "Sentry untuk error tracking (Next.js + Elysia). Railway built-in metrics untuk CPU/RAM. Custom metric untuk AI cost per hari via Supabase query.", consequences: ["Alert ke email/Slack kalau error rate spike", "AgentJob duration tracking untuk detect slow agents", "AI cost dashboard harian — tau kalau ada anomali penggunaan", "Sentry free tier cukup untuk early stage"], alternatives: ["Datadog (overkill + mahal)", "Grafana self-hosted (terlalu berat untuk solo dev)", "Tidak ada observability (blind — tidak acceptable)"] },
];

const UNCOVERED = [
  {
    area: "Xendit Webhook Handler", priority: "P0", owner: "Elysia API — /webhooks/xendit",
    desc: "Payment lifecycle handler. Harus idempotent, verify signature, handle semua event Xendit.",
    sections: [
      { title: "Endpoint & Security", items: ["POST /webhooks/xendit — public endpoint (no auth), verify via X-CALLBACK-TOKEN header", "X-CALLBACK-TOKEN = env.XENDIT_WEBHOOK_SECRET — tolak 401 kalau tidak match", "Idempotency: cek xendit_payment_id di tabel payments sebelum proses — skip kalau sudah ada", "Response selalu 200 ke Xendit (bahkan kalau internal error) — log error internal, jangan retry loop"] },
      { title: "Event Handlers", items: ["payment.paid → Subscription.status = active, reset ai_quota_used = 0, kirim email payment_success + invoice PDF", "payment.expired → status = past_due, kirim email payment_failed, set grace_period_end = now + 3 days", "payment.failed → status = past_due, kirim email payment_failed", "subscription.cycle_renewal → generate invoice baru, trigger payment baru", "topup payment.paid → tambah ai_quota_limit += 3, insert Topup record"] },
      { title: "Grace Period Logic", items: ["past_due + grace period aktif: user masih bisa akses semua fitur", "past_due + grace period expired: downgrade ke Free behavior (download locked, Full AI locked)", "Cek grace period di middleware setiap request yang butuh subscription check", "Banner warning di app saat grace period aktif: 'Pembayaran gagal — akses berakhir dalam X hari'"] },
      { title: "Audit Logging", items: ["Log semua incoming webhook ke tabel webhook_logs { xendit_event, payload, processed_at, error? }", "Berguna untuk debug dan audit trail billing dispute"] },
    ],
  },
  {
    area: "RLS Policy Supabase", priority: "P0", owner: "Supabase — database migrations",
    desc: "Multi-tenant row-level isolation. User hanya bisa akses data milik mereka atau school mereka. Admin internal bypass semua via service_role.",
    sections: [
      { title: "User & School", items: ["users: SELECT own row only (auth.uid() = id)", "schools: SELECT kalau school_id = user.school_id", "schools: INSERT/UPDATE only by role = kepala_sekolah milik school itu"] },
      { title: "Module", items: ["modules: SELECT WHERE user_id = auth.uid() OR school_id = user.school_id", "modules: INSERT WHERE user_id = auth.uid() — user hanya bisa buat modul sendiri", "modules: UPDATE WHERE user_id = auth.uid() — tidak bisa edit modul guru lain", "modules: SELECT WHERE is_curated = true — public read tanpa auth (untuk library)", "module_migrations: SELECT/UPDATE WHERE module.user_id = auth.uid()"] },
      { title: "Billing", items: ["subscriptions: SELECT WHERE user_id = auth.uid() OR school_id = user.school_id", "subscriptions: INSERT/UPDATE — server only (service_role key dari Elysia, bukan client)", "payments + topups: SELECT WHERE user = auth.uid(), INSERT — server only"] },
      { title: "AI Agent", items: ["agent_jobs: SELECT/INSERT WHERE user_id = auth.uid()", "agent_steps: SELECT WHERE job.user_id = auth.uid()", "agent_steps: INSERT/UPDATE — server only (Elysia service_role)"] },
      { title: "Admin Override", items: ["Super admin: bypass semua RLS via service_role key", "Jangan expose service_role key ke frontend — hanya di Elysia server environment", "curriculum_versions + module_templates: SELECT public, INSERT/UPDATE super_admin only"] },
    ],
  },
  {
    area: "Rate Limiting & Abuse Prevention", priority: "P0", owner: "Elysia API — middleware",
    desc: "Prevent abuse AI endpoint. Enforce quota. Protect dari spam request.",
    sections: [
      { title: "AI Quota Enforcement", items: ["Sebelum dispatch orchestrator: SELECT ai_quota_used, ai_quota_limit FROM subscriptions WHERE user_id", "Kalau used >= limit → return 429 { error: 'quota_exceeded', quota_used, quota_limit, topup_url }", "Free tier: Full AI → return 403 { error: 'plan_required', upgrade_url }", "Quota increment: UPDATE subscriptions SET ai_quota_used = ai_quota_used + 1 AFTER job sukses", "Quota reset: tiap tanggal billing (subscription.current_period_start)"] },
      { title: "Request Rate Limiting", items: ["Elysia plugin: @elysiajs/rate-limit", "Global: 100 req/menit per IP", "POST /agent/generate: 5 req/menit per user_id (prevent spam Full AI)", "POST /agent/assist: 20 req/menit per user_id", "POST /webhooks/xendit: 50 req/menit per IP", "Return 429 dengan header Retry-After"] },
      { title: "Abuse Detection", items: ["Monitor AgentJob.tokens_used — flag kalau > 2x rata-rata per modul", "Alert Sentry kalau satu user trigger > 20 agent jobs dalam 1 jam", "Blacklist user_id via tabel user_flags { user_id, reason, flagged_at, resolved_at }", "Auto-block kalau ai_quota_used > ai_quota_limit * 2 (quota bypass attempt)"] },
    ],
  },
  {
    area: "Admin Panel Internal", priority: "P1", owner: "Next.js — /admin (role: super_admin)",
    desc: "Dashboard internal tim Modulajar. Manage kurikulum, curate modul, monitor bisnis.",
    sections: [
      { title: "Akses & Auth", items: ["Route /admin — middleware cek role = super_admin, redirect 403 kalau bukan", "Super admin dibuat manual via Supabase dashboard (tidak ada self-register)", "Separate layout dari app guru — tidak ada navigation shared"] },
      { title: "Kurikulum Manager", items: ["CRUD CurriculumVersion: nama, kode, fase, tahun, status", "ModuleTemplate editor: form builder berbasis JSON Schema", "migration_rules editor: JSON editor dengan syntax highlighting + validasi struktur", "Publish version: konfirmasi dialog → trigger Edge Function auto-migrate → monitor progress", "Preview template: render form yang akan dilihat guru"] },
      { title: "Kurator Modul", items: ["List semua modul published dari semua guru", "Filter: mapel, fase, rating, jumlah fork", "Flag is_curated = true + assign curated_by = admin_id", "Preview modul sebelum curate, un-curate kalau ada laporan masalah"] },
      { title: "Business Dashboard", items: ["MRR: sum active subscriptions per plan × harga", "Total user aktif (login dalam 30 hari)", "AI cost hari ini: sum AgentJob.cost_idr WHERE created_at >= today", "Conversion rate: free → paid", "New signup per hari — chart 30 hari", "Churn: cancelled subscriptions bulan ini"] },
      { title: "User Management", items: ["Search user by email / nama sekolah", "Lihat subscription status + payment history", "Manual override: extend subscription, tambah quota", "Ban user: set user_flags, block login", "Impersonate user (untuk debug — log semua impersonation action)"] },
    ],
  },
  {
    area: "Error Handling & Agent Retry", priority: "P1", owner: "Elysia API — agents package",
    desc: "Agent bisa gagal di mana saja. Harus bisa resume dari step terakhir, bukan restart dari awal. Partial result jangan dibuang.",
    sections: [
      { title: "AgentJob Lifecycle", items: ["queued → running → done | failed", "AgentStep.status: pending → running → done | failed", "Tiap step simpan output ke agent_steps.output JSONB — meski step berikutnya gagal, data ini aman", "Orchestrator passing output tiap step ke step berikutnya sebagai context"] },
      { title: "Retry Logic", items: ["Max retry per step: 3x dengan exponential backoff (1s, 2s, 4s)", "Setelah 3x gagal: mark step failed, mark job failed, notify user", "Resume endpoint: POST /agent/jobs/:id/retry", "Resume logic: skip steps dengan status done, mulai dari step failed", "Jangan decrement quota kalau job gagal total — hanya increment kalau done"] },
      { title: "Error Categories", items: ["Claude API timeout (>30s): retry dengan prompt yang sama", "Claude API rate limit (429): wait + retry, surface error kalau > 3x", "Claude invalid JSON output: retry dengan prompt 'respond only valid JSON'", "Supabase write failure: retry 3x, kalau gagal rollback AgentJob", "User disconnected (SSE closed): job tetap jalan di background, user bisa cek status via polling"] },
      { title: "User Communication", items: ["SSE event: { type: 'step_failed', step: 'tp_agent', retrying: true }", "SSE event: { type: 'job_failed', message: 'Generasi gagal. Coba lagi.' }", "In-app notification: 'Pembuatan modul gagal — klik untuk coba lagi'", "Quota tidak dipakai kalau job failed"] },
    ],
  },
  {
    area: "Edge Function: Auto-Migrate Kurikulum", priority: "P1", owner: "Supabase Edge Function",
    desc: "Triggered saat admin publish CurriculumVersion baru. Batch processing, tidak lock DB, partial failure safe.",
    sections: [
      { title: "Trigger", items: ["Prefer: admin panel call POST /admin/curriculum/:id/publish → Elysia trigger Edge Function (lebih kontrol)", "Alternatif: Supabase Database Webhook on curriculum_versions UPDATE status = active"] },
      { title: "Migration Process", items: ["1. Load migration_rules dari ModuleTemplate baru", "2. Query affected modules: SELECT * FROM modules WHERE curriculum_version_id = old_id LIMIT 50", "3. Tiap modul: apply field_map (rename key di JSONB), set default untuk new_required, flag deprecated dengan prefix '_deprecated_'", "4. INSERT module_migrations { module_id, from_version_id, to_version_id, status: pending_review, diff }", "5. Jangan UPDATE modules.content dulu — tunggu guru review dan accept", "6. Fetch 50 berikutnya, repeat sampai selesai"] },
      { title: "Diff Format", items: ["diff JSONB: { added: [{field, value}], changed: [{field, old, new}], removed: [{field}], needs_input: [field] }", "needs_input = field baru required tapi tidak ada di migration_rules default", "UI highlight needs_input sebagai wajib diisi sebelum guru bisa accept"] },
      { title: "Failure Handling", items: ["Gagal pada satu modul: log error, lanjut modul berikutnya", "Setelah semua selesai: report ke admin — X berhasil, Y gagal, list failed module IDs", "Modul gagal: tetap di version lama, flag needs_manual_migration = true", "Admin bisa trigger ulang migration untuk modul tertentu via admin panel"] },
      { title: "Notifikasi", items: ["INSERT notifications { user_id, type: migration_ready, meta: { module_id, version_name } }", "Kirim email via Resend: template migration_ready", "Dashboard banner: 'X modul perlu di-review untuk Kurikulum [nama]'"] },
    ],
  },
  {
    area: "CI/CD Pipeline", priority: "P1", owner: "GitHub Actions",
    desc: "Automated test, lint, typecheck, deploy. Solo dev butuh safety net yang tidak ribet.",
    sections: [
      { title: "On Pull Request", items: ["Trigger: PR ke main branch", "Jobs: typecheck (tsc --noEmit) + lint (eslint + biome) + unit tests", "Vercel: auto-deploy preview per PR (preview URL di PR comment otomatis)", "Block merge kalau ada job yang gagal", "Target runtime: < 3 menit"] },
      { title: "On Push to Main", items: ["Jobs: typecheck + lint (harus pass sebelum deploy)", "Supabase migrations: supabase db push via Supabase CLI", "Deploy Elysia ke Railway: auto via GitHub integration (railway.json di apps/api)", "Deploy Next.js ke Vercel: auto via Vercel GitHub integration", "Post-deploy health check: curl https://api.modulajar.app/health"] },
      { title: "Secrets", items: ["GitHub Actions Secrets: SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY, XENDIT_SECRET, RESEND_API_KEY", "Railway: env vars di Railway dashboard", "Vercel: env vars di Vercel dashboard", "Jangan pernah commit .env file — .gitignore ketat"] },
      { title: "Database Safety", items: ["Supabase migration files di supabase/migrations/ — versioned di git", "Tidak boleh DROP tanpa backup step di migration file", "Staging environment (Supabase project terpisah) untuk test migration sebelum production"] },
    ],
  },
  {
    area: "Email Templates (Resend + React Email)", priority: "P1", owner: "Elysia API — email service",
    desc: "8 transactional email templates. Bahasa Indonesia. Responsive. Brand consistent.",
    sections: [
      { title: "Template List", items: ["welcome — setelah signup: greeting, 3 langkah onboarding, CTA 'Buat Modul Pertama'", "payment_success — konfirmasi bayar: detail plan, periode, link download invoice PDF", "payment_failed — gagal bayar: alasan, link billing page, info grace period 3 hari", "subscription_expiring — 7 hari sebelum expired: reminder perpanjang", "migration_ready — kurikulum baru: nama kurikulum, jumlah modul affected, CTA review", "quota_warning — sisa 2 modul Full AI: info top-up Rp 5.000", "export_ready — PDF siap (async export): link download, expired 7 hari", "school_invite — kepala sekolah invite guru: nama sekolah, link join + set password"] },
      { title: "Technical Setup", items: ["Package: @react-email/components + resend", "Template di packages/emails/ — preview via email.dev server lokal", "Kirim dari: noreply@modulajar.app (domain verify di Resend)", "Reply-to: support@modulajar.app", "Semua email Bahasa Indonesia — tone warm, tidak kaku"] },
      { title: "Design Spec", items: ["Header: logo Modulajar + warna primary #4F46E5", "Font: system font stack (email client tidak support Google Fonts)", "CTA button: bg #4F46E5, text putih, border-radius 8px, padding 12px 24px", "Footer: link unsubscribe (non-transactional only), alamat PT, copyright", "Max width: 600px, responsive untuk mobile"] },
    ],
  },
  {
    area: "Invoice PDF — BOS Compliance", priority: "P1", owner: "Elysia API — invoice service (React-PDF)",
    desc: "Invoice resmi untuk pertanggungjawaban BOS. NPWP, PPN 11%, nomor sequential, tanda terima sah.",
    sections: [
      { title: "Invoice Number", items: ["Format: INV-{YYYY}-{NNNNNN} — contoh: INV-2025-000001", "Sequential per tahun, auto-increment dari tabel invoice_sequences", "Jangan pakai UUID — auditor butuh nomor yang mudah dibaca dan diurutkan"] },
      { title: "Konten Wajib (BOS)", items: ["Header: nama PT, NPWP PT, alamat, nomor telepon", "Kepada: nama sekolah, NPSN, NPWP sekolah (opsional), alamat sekolah", "Nomor & tanggal invoice", "Detail layanan: nama paket, periode (dari - sampai), jumlah akun guru", "Subtotal, PPN 11%, Total dalam Rupiah", "Status: LUNAS / BELUM LUNAS", "Metode pembayaran + tanggal bayar (kalau LUNAS)", "Catatan: 'Tanda terima sah tanpa tanda tangan (generated sistem Modulajar)'"] },
      { title: "Technical Flow", items: ["Generate saat: payment.paid webhook diterima", "Render via @react-pdf/renderer di Elysia server", "Upload ke Supabase Storage: bucket invoices/, path invoices/{school_id}/INV-2025-000001.pdf", "Storage policy: private — hanya akses via signed URL", "Signed URL: expired 30 hari, generate ulang on-demand kalau expired", "Update payments.invoice_url dengan signed URL", "Kirim via email payment_success"] },
      { title: "Per Plan", items: ["Free: tidak ada invoice (tidak bayar)", "Guru Pro individual: invoice simple tanpa NPWP (opsional, toggle di settings)", "Plan Sekolah: invoice lengkap dengan NPWP wajib diisi saat checkout"] },
    ],
  },
  {
    area: "Observability & Logging", priority: "P2", owner: "Sentry + Railway + Supabase",
    desc: "Solo dev butuh tau kalau ada yang rusak tanpa mantengin dashboard. Alert otomatis untuk anomali.",
    sections: [
      { title: "Error Tracking (Sentry)", items: ["Next.js: @sentry/nextjs — capture runtime errors + Web Vitals", "Elysia: @sentry/node — capture uncaught exceptions + agent failures", "Custom context: sentry.setUser({ id, plan }) di setiap request", "Custom tags: agent_name, job_id, module_id untuk filter error AI agent", "Alert: kirim ke email/Slack kalau error rate > 5 error/menit"] },
      { title: "AI Cost Monitoring", items: ["AgentJob.tokens_used + cost_idr dicatat tiap job selesai", "Daily cron (Supabase Edge Function): aggregate AI cost hari ini ke tabel daily_metrics", "Alert: kalau daily_cost > Rp 500.000 (anomali — kemungkinan abuse)", "Admin dashboard: chart AI cost 30 hari, breakdown per agent type"] },
      { title: "Performance Monitoring", items: ["Railway: built-in CPU + RAM + request metrics di dashboard", "AgentJob duration tracking — alert kalau > 90 detik (agent stuck)", "Next.js: Web Vitals via Vercel Analytics (gratis)", "Supabase: slow query log via Supabase dashboard → optimasi index"] },
      { title: "Audit Log", items: ["Tabel audit_logs { user_id, action, resource_type, resource_id, meta, created_at }", "Log: modul published/deleted, subscription changed, admin actions, impersonation", "Retention: 1 tahun", "Berguna untuk support ticket dan dispute billing"] },
    ],
  },
  {
    area: "Search & Filter Curated Library", priority: "P2", owner: "Next.js + Supabase FTS",
    desc: "Guru browse dan fork modul dari library publik. Cepat dan relevan.",
    sections: [
      { title: "Search", items: ["Supabase full-text search: tsvector column di modules (title + subject + topik)", "Query: WHERE is_curated = true AND search_vector @@ to_tsquery('indonesian', query)", "pg_trgm extension untuk fuzzy search (typo tolerant)", "Tidak perlu Elasticsearch untuk early stage — Postgres FTS cukup"] },
      { title: "Filter & Sort", items: ["Mata pelajaran (multiselect)", "Fase: A–F", "Kelas: 1–12", "Kurikulum version: K13, Merdeka 2022, Merdeka 2025", "Sort: Terpopuler (fork_count DESC) / Terbaru / Relevan (FTS score)"] },
      { title: "UI", items: ["Card grid: 2 kolom desktop, 1 kolom mobile", "Card: mapel, fase, kelas, fork count, nama kurator", "Preview modal: lihat isi modul sebelum fork", "Fork CTA: 'Gunakan Modul Ini' → copy dengan user_id = current, redirect ke editor"] },
    ],
  },
  {
    area: "Modul Export PDF (Puppeteer)", priority: "P1", owner: "Elysia API — export service",
    desc: "Export modul ajar ke PDF A4. Free = diagonal watermark. Pro/Sekolah = clean. Format Kemendikbud.",
    sections: [
      { title: "Format Standar", items: ["Header tiap halaman: nama sekolah (plan Sekolah), mata pelajaran, fase/kelas", "Sections: Identitas Modul → CP → TP → ATP → Kegiatan → Asesmen", "Footer: nomor halaman, tanggal cetak, 'Dibuat dengan Modulajar'", "Ukuran: A4, margin 2.5cm semua sisi", "Font: Times New Roman 12pt (standar dokumen resmi sekolah)"] },
      { title: "Watermark Free Tier", items: ["Diagonal watermark: 'MODULAJAR — UPGRADE UNTUK PDF BERSIH' opacity 15%", "Warna: #4F46E5", "Muncul di setiap halaman", "Banner halaman pertama: 'Upgrade ke Guru Pro untuk PDF tanpa watermark'"] },
      { title: "Technical Flow", items: ["Ambil module.content dari Supabase", "Render HTML template dengan data modul di Elysia", "Puppeteer: launch browser → go to HTML → waitForNetworkIdle → pdf({ format: 'A4' })", "Inject watermark CSS layer kalau free tier", "Upload ke Supabase Storage: exports/{user_id}/{module_id}-{ts}.pdf", "Return signed URL 7 hari, hapus file temp lokal", "File expired otomatis di Storage setelah 7 hari (lifecycle rule Supabase)"] },
    ],
  },
];

const ROADMAP = [
  { phase: "Phase 0", title: "Foundation", weeks: "Week 1–2", color: "#6366F1", items: ["Monorepo setup: Turborepo + pnpm workspaces", "Package structure: @modulajar/db, @modulajar/agents, @modulajar/shared", "Supabase project — semua tabel + constraint + index", "RLS policy per school_id & user_id (semua tabel)", "Supabase Auth — email + Google SSO", "Elysia + Bun bootstrap di Railway (health endpoint, CORS config)", "Next.js 15 App Router bootstrap di Vercel", "GitHub Actions CI: typecheck + lint on PR", "GitHub Actions CD: deploy ke Railway + Vercel on main merge", "Supabase migrations via CLI di CI pipeline", "Seed: CP Kurikulum Merdeka semua mapel Fase A–F", "Seed: CurriculumVersion K13 + Merdeka 2022 + ModuleTemplate keduanya", "Staging Supabase project untuk test migration"] },
  { phase: "Phase 1", title: "Core Editor", weeks: "Week 3–5", color: "#10B981", items: ["Auth pages: login, register, forgot password", "Onboarding wizard 3 step: nama, mapel, fase default", "Dashboard guru: stat cards, list modul terbaru, quota bar", "Dynamic form renderer dari ModuleTemplate.schema (JSONB → React form)", "Scratch editor — per-section dengan Tiptap rich text", "Autosave ke Supabase (debounce 2 detik + indicator)", "Module status flow: draft → published → archived", "Preview modul di app (read-only, mobile-friendly)", "Curated library: full-text search, filter mapel/fase/kelas", "Fork modul: copy dengan user_id = current, redirect ke editor", "Settings: profil guru, preferensi notifikasi"] },
  { phase: "Phase 2", title: "AI Agent Layer", weeks: "Week 6–7", color: "#8B5CF6", items: ["Tier 2: CP Agent (query dari seed data CP)", "Tier 2: TP Agent (ABCD format, measurable)", "Tier 2: ATP Agent (alur per minggu, sequence logic)", "Tier 2: Activity Agent (diferensiasi gaya belajar)", "Tier 2: Asesmen Agent (diagnostik, formatif, sumatif)", "Tier 2: Validator Agent (check vs template schema)", "Orchestrator Agent: dispatch Tier 2 sekuensial, passing output antar step", "AgentJob + AgentStep tracking di Supabase", "SSE endpoint di Elysia: stream step progress ke frontend", "AI quota check middleware (enforce per plan sebelum dispatch)", "Error handling + retry logic: max 3x per step, exponential backoff", "Resume endpoint: POST /agent/jobs/:id/retry (skip completed steps)", "Full AI wizard: 4-step form + generating screen real-time checklist", "Scratch + AI Assist per section: Suggest / Improve / Generate / Check", "Rate limiting: @elysiajs/rate-limit per IP + per user_id"] },
  { phase: "Phase 3", title: "Versioning & Migration", weeks: "Week 8–9", color: "#F59E0B", items: ["Admin panel internal: route /admin, super_admin auth middleware", "Admin: CRUD CurriculumVersion + ModuleTemplate", "Admin: migration_rules JSON editor dengan validasi struktur", "Admin: publish version button + konfirmasi dialog", "Supabase Edge Function: auto-migrate saat version dipublish", "Batch processing: 50 modul per batch, tidak lock DB", "ModuleMigration: insert diff JSONB untuk semua modul affected", "Partial failure safe: log error, lanjut modul berikutnya, report ke admin", "UI diff review: before/after per field, tag BERUBAH/BARU/DIHAPUS/PERLU DIISI", "Inline edit untuk field needs_input dari halaman diff review", "Tombol: Terima & Simpan / Edit Manual / Tolak + konfirmasi dialog", "Notifikasi in-app (tabel notifications) + email Resend migration_ready", "Dashboard banner: 'X modul perlu review untuk Kurikulum [nama]'"] },
  { phase: "Phase 4", title: "Billing & Export", weeks: "Week 10–11", color: "#EF4444", items: ["Xendit integration: subscription API + payment link API", "Checkout flow: pilih plan → pilih metode → redirect Xendit → return_url", "Webhook handler: POST /webhooks/xendit — semua events, idempotent", "Grace period logic: past_due → 3 hari → suspend akses", "Top-up flow: Rp 5.000 = +3 modul Full AI (Xendit one-time payment link)", "Invoice number sequential: tabel invoice_sequences per tahun", "Invoice PDF: React-PDF untuk billing invoice (BOS compliance)", "Invoice: NPWP, PPN 11%, nomor sequential, tanda terima sah", "Upload invoice ke Supabase Storage (private bucket), signed URL 30 hari", "Kirim invoice otomatis via Resend email payment_success", "Modul export PDF: Puppeteer HTML → PDF, format A4 Kemendikbud", "Watermark diagonal untuk free tier", "Upload export ke Storage, signed URL 7 hari, auto-expire lifecycle rule", "Upgrade prompt slide-up sheet saat free user klik download", "Billing settings page: plan, quota bar, riwayat bayar, download invoice", "8 email templates React Email (welcome, payment_success/failed, migration_ready, dll)"] },
  { phase: "Phase 5", title: "Multi-tenant & Production", weeks: "Week 12", color: "#0EA5E9", items: ["School plan: kepala sekolah dashboard", "Kepala sekolah: invite guru via email (link join + set password)", "Kepala sekolah: monitor semua modul guru + status kurikulum compliance", "Laporan: berapa guru yang sudah buat modul sesuai kurikulum aktif", "Branding sekolah di PDF export: logo + nama sekolah di header", "Subdomain routing: sman1bdg.modulajar.app (Next.js middleware + Vercel wildcard)", "Admin panel: business dashboard (MRR, total user, AI cost, conversion, churn)", "Admin panel: user management (search, ban, manual override)", "Sentry error tracking setup (Next.js + Elysia)", "AI cost daily cron + alert kalau daily_cost anomali", "Audit log: tabel audit_logs semua major actions", "Abuse detection: monitor per-user agent job frequency", "Staging full regression testing sebelum v1.0 launch"] },
];

const UI_SPEC = [
  { screen: "Login / Register", route: "/login, /register", desc: "Auth pages. Clean, tidak overwhelming. Google SSO as primary CTA.", components: ["Logo + tagline: 'Buat Modul Ajar Kurikulum Merdeka dalam menit'", "Google SSO button (primary — paling banyak guru pakai Gmail)", "Email + password form (secondary)", "Link: 'Daftar' / 'Sudah punya akun? Masuk'", "Forgot password link → kirim email reset"], states: ["default", "loading (submit)", "error (invalid credential)", "success (redirect)"], mobile: "Single column, input full width, keyboard-aware scroll" },
  { screen: "Onboarding Wizard", route: "/onboarding", desc: "3-step wizard setelah pertama register. Personalisasi pengalaman.", components: ["Step 1: nama lengkap + nama sekolah + NPSN (opsional)", "Step 2: mata pelajaran yang diajar (multi-select chips)", "Step 3: fase kurikulum default (A–F) + kelas yang diajar", "Progress: 1 of 3 / 2 of 3 / 3 of 3", "Skip button (semua opsional kecuali nama)", "Selesai → redirect dashboard"], states: ["step 1–3", "submit loading", "skip confirm"], mobile: "Full screen per step, swipe atau tap Next" },
  { screen: "Dashboard", route: "/dashboard", desc: "Home setelah login. Overview modul + quick actions.", components: ["Greeting: 'Selamat pagi, Bu Sari! ☀️' (time-aware)", "Banner: migration pending (kuning) / past_due warning (merah) / normal (hidden)", "CTA: [+ Buat Modul Baru] — paling prominent", "Stat cards: Draft / Selesai / Perlu Update (migration pending count)", "Quota bar (Guru Pro): 'X dari 10 slot AI bulan ini' + [+ Top-up]", "List modul terbaru: max 5, status badge, quick actions", "Link 'Lihat semua →'"], states: ["empty state (guru baru, ilustrasi + CTA)", "normal", "migration banner", "past_due warning"], mobile: "Vertical stack, stat cards 2×2 grid" },
  { screen: "Daftar Modul", route: "/modules", desc: "Semua modul guru. Filter, search, bulk actions.", components: ["Search bar by judul / topik", "Filter chips: Semua / Draft / Published / Perlu Update", "Filter dropdown: mapel, fase, kelas, kurikulum version", "Sort: Terbaru / Terlama / Abjad A–Z", "Card modul: judul, mapel, fase, status badge, tanggal edit, (...) action menu", "Action menu: Edit / Preview / Duplicate / Archive / Hapus (confirm dialog)", "Pagination (20 per page)"], states: ["empty", "list normal", "loading skeleton", "search kosong"], mobile: "List view (bukan grid) — lebih scannable di layar kecil" },
  { screen: "Mode Selection", route: "/modules/new", desc: "Pilih cara buat modul. Decision point utama.", components: ["3 card besar: Full AI / Curated Library / Scratch + Assist", "Tiap card: icon 48px, nama, deskripsi 2 baris, badge info", "Full AI card: badge 'Pakai 1 slot AI' — disabled + lock icon kalau Free/quota habis", "Hover/tap: card highlight dengan border warna, slight scale up", "Tooltip Free tier Full AI: 'Tersedia di Guru Pro — Rp 29.000/bulan'"], states: ["free tier (Full AI disabled)", "guru pro dengan quota", "quota habis (Full AI disabled + badge Habis)"], mobile: "Vertical stack full width cards" },
  { screen: "Full AI Wizard", route: "/modules/new/ai", desc: "4-step input wizard sebelum AI generate.", components: ["Progress bar: animated fill, label 'Langkah X dari 4'", "Step 1: Mata Pelajaran + Fase + Kelas (semua dropdown)", "Step 2: Topik utama (text input, contoh placeholder) + Durasi (dropdown)", "Step 3: Gaya belajar siswa (4 card pilihan: Visual / Auditori / Kinestetik / Campuran)", "Step 4: Catatan tambahan opsional (textarea) + summary box + tombol [Generate Sekarang]", "Back button step 2–4, disable Next kalau required kosong"], states: ["step 1–4", "loading submit", "validation error"], mobile: "Full screen per step, sticky CTA button bawah" },
  { screen: "AI Generating", route: "/modules/new/ai/generating", desc: "Real-time progress SSE. Harus engaging, tidak terasa lama.", components: ["Ilustrasi animasi (CSS animation pencil/robot menulis)", "Judul dinamis update per step: 'Membaca Capaian Pembelajaran...'", "Checklist 6 steps: ✅ done / ⏳ spinner running / ○ pending", "Labels: CP → TP → ATP → Kegiatan → Asesmen → Validasi", "Progress bar animasi bawah", "Teks: 'Biasanya selesai dalam 30–60 detik'", "Tidak ada tombol cancel"], states: ["streaming tiap step update", "done → auto redirect ke editor", "failed → error message + [Coba Lagi]"], mobile: "Centered vertical, tidak ada scroll" },
  { screen: "Module Editor", route: "/modules/[id]/edit", desc: "Core editor. Sidebar outline + section content. Layout berbeda desktop/mobile.", components: ["Sidebar kiri (desktop): daftar sections, klik scroll ke section, dot indicator filled/empty", "Toolbar atas: judul modul (editable inline) + [Preview] [Simpan Draft] [Publish] [...]", "Tiap section: nama section header + Tiptap editor + [✨ AI Assist] button kanan atas", "AI Assist dropdown: Suggest / Improve / Generate dari awal / Validasi section ini", "AI Assist loading: shimmer skeleton dalam section", "Autosave indicator: 'Tersimpan otomatis 2 detik lalu' → fade out setelah 3 detik", "Migration pending banner kuning: 'Kurikulum baru tersedia — [Review]'"], states: ["draft editable", "published read-only + [Edit Lagi]", "migration pending banner", "AI assist loading per section"], mobile: "Accordion sections, satu open at a time, bottom sticky bar [◀ Sebelumnya] [Nama Section ▾] [Berikutnya ▶]" },
  { screen: "Migration Diff Review", route: "/modules/[id]/migration", desc: "Review perubahan kurikulum. Kritis — harus jelas dan tidak membingungkan guru.", components: ["Banner biru: 'Kurikulum [nama] tersedia — review perubahan di bawah'", "Info card: dari versi [lama] → ke versi [baru], tanggal migrasi otomatis", "Per field berubah: label + before (abu, strikethrough) / after (hijau) side by side", "Tag berwarna: BERUBAH (amber) / BARU (green) / DIHAPUS (red)", "PERLU DIISI (red + ⚠️): field baru required belum ada default", "Inline text input untuk PERLU DIISI langsung di halaman ini", "Sticky bottom bar: [Tolak — Tetap versi lama] [Terima & Perbarui] + konfirmasi dialog"], states: ["pending_review (editable, harus isi PERLU DIISI)", "accepted (read-only, info 'Sudah diperbarui ke [versi]')", "rejected (info 'Tetap di [versi lama]')"], mobile: "Stacked (before atas, after bawah) bukan side by side" },
  { screen: "Curated Library", route: "/library", desc: "Browse modul publik yang dikurasi. Fork untuk dipakai sendiri.", components: ["Search bar full width + filter row (Mapel / Fase / Kelas / Sort)", "Card grid: 2 kolom desktop, 1 kolom mobile", "Card: strip warna mapel di kiri, judul, fase/kelas chip, kurator badge, fork count, [Preview] [Gunakan]", "Preview modal/bottom sheet: scroll isi modul sebelum fork", "Gunakan CTA: konfirmasi satu klik → redirect ke editor (konten sudah terisi)"], states: ["browsing grid", "search/filter result", "empty result (saran lain)", "preview modal/sheet open", "forking loading"], mobile: "Single column, filter collapsible" },
  { screen: "Export & Download", route: "Modal dari editor toolbar", desc: "Trigger export PDF. Free: upgrade prompt. Pro: generate dan download.", components: ["Free tier: slide-up bottom sheet — ilustrasi PDF + harga + [Upgrade Guru Pro] + [Lihat Preview]", "Pro/Sekolah: loading 'Menyiapkan PDF...' → done: [⬇ Download PDF] + [🔗 Salin Link Publik]", "Share toggle: Publik / Privat", "Info: 'Format A4, sesuai standar Kemendikbud, siap cetak'"], states: ["free (upgrade sheet)", "pro generating (Puppeteer jalan)", "pro done (link aktif 7 hari)", "error generate (retry button)"], mobile: "Full bottom sheet, tombol full width stacked" },
  { screen: "Billing & Quota", route: "/settings/billing", desc: "Plan info, quota, riwayat bayar, top-up, download invoice.", components: ["Plan card: nama plan + badge status (Active/Past Due) + periode aktif", "Past due banner: 'Pembayaran gagal — akses penuh berakhir dalam X hari' + [Bayar Sekarang]", "Quota bar (Guru Pro): 'X dari 10 slot AI bulan ini' + progress bar + [+ Top-up Rp 5.000]", "Riwayat: tabel tanggal / deskripsi / metode / jumlah / status / [Download Invoice]", "Upgrade card (Free tier): pricing + CTA", "Sekolah: input NPWP + nama PIC untuk kelengkapan invoice BOS"], states: ["free (upgrade CTA prominent)", "guru_pro active", "guru_pro past_due (warning banner)", "sekolah"], mobile: "Vertical stack, tabel riwayat scroll horizontal" },
  { screen: "Admin Panel", route: "/admin (super_admin only)", desc: "Internal dashboard. Dark mode. Dense layout.", components: ["Sidebar: Kurikulum / Modul Kurator / Users / Bisnis / Settings", "Kurikulum: tabel versi, tombol [+ Tambah], status chip, [Publish] + konfirmasi", "Template editor: JSON editor dengan syntax highlighting", "Bisnis: MRR card, user aktif, AI cost hari ini, chart signup 30 hari, conversion rate", "Users: search, filter plan, detail user, [Ban] [Override Quota] [Impersonate]", "Kurator: grid modul published, toggle curated, preview sebelum curate"], states: ["per sub-page independen", "loading data", "confirm dialogs untuk destructive actions"], mobile: "Tidak dioptimasi untuk mobile — admin selalu di desktop" },
];

const CHANGELOG = [
  { version: "0.1.0", date: "2025-04-27", type: "planning", label: "Architecture & Full Spec", changes: ["ADR-001–009: semua architecture decisions tercatat", "Domain mapping: 6 bounded domain, semua entity + RLS policy", "Stack final: Next.js + Elysia/Bun + Supabase + Xendit + Resend + Railway/Vercel", "Billing tiers: Free / Guru Pro Rp 29.000 / Sekolah Rp 499.000 (Xendit, pasar Indonesia)", "UI/UX direction: Friendly + colorful, Plus Jakarta Sans, fully responsive", "11 area teknis fully specced (Webhook, RLS, Rate Limit, Admin, Agent Retry, Edge Function, CI/CD, Email, Invoice, Observability, Library, Export)", "Roadmap 5 phase 12 minggu", "13 screen UI spec dengan states + mobile behavior"] },
  { version: "0.2.0", date: "2026-04-28", type: "done", label: "Foundation", changes: ["Monorepo Turborepo + pnpm workspaces (@modulajar/db, @modulajar/shared, @modulajar/agents)", "Next.js 15 App Router bootstrap di Vercel", "Elysia + Bun bootstrap di Railway (health endpoint, CORS config)", "GitHub Actions CI: typecheck + lint + db-migrations validate on PR", "GitHub Actions CD: deploy API → Railway, trigger Vercel → Web, regression tests on staging", "Branch protection on main: require PR + 1 approval + passing CI gate", "ESLint upgrade v10 → v9 (flat config required by Next.js 15)", "Tailwind CSS v4: @tailwindcss/postcss plugin + CommonJS config fix", "Next.js 15 params: migrated to useParams() hook (params now async)", "Static prerender fix: dynamic='force-dynamic' on all Supabase-dependent pages", "Supabase client fallback env vars (prevents build crash at build time)"], pending: ["Supabase schema lengkap + RLS policy (P0 dari UNCOVERED)", "Auth: email + Google SSO wired ke Supabase Auth", "Seed data: CP Kurikulum Merdeka + CurriculumVersion K13 + ModuleTemplate"] },
  { version: "0.2.1", date: "2026-04-28", type: "done", label: "Core Editor (in progress)", changes: ["Auth pages: login, register, onboarding (UI done, belum wired ke Supabase Auth)", "Dashboard guru: stat cards, quota bar, grace period banner, recent modules (UI done)", "Daftar modul: filter/search cards (UI done)", "Settings page: plan info, quota bar, profile edit (UI done)", "Library page: curated module grid (UI done)", "Mode selection page: Full AI / Library / Scratch (UI done)", "AI wizard page: 4-step form + generating screen (UI done)", "Module editor: SchemaRenderer + Tiptap editor + autosave (UI done)", "Module preview page: read-only view (UI done)", "Settings/billing page placeholder (Phase 4)", "Migration banner support di dashboard (UI-ready)"], pending: ["Wire semua auth ke Supabase Auth + Elysia middleware", "Scratch editor per-section autosave wired ke Supabase", "Module status flow: draft → published → archived", "Fork modul wired ke Supabase", "Onboarding wizard save ke users table"] },
  { version: "0.3.0", date: "TBD — Week 5", type: "planned", label: "Core Editor (finalize)", changes: ["Auth pages + onboarding wizard (wire ke Supabase Auth + Elysia)", "Dashboard guru + daftar modul + filter/search (wire ke Supabase)", "Dynamic form renderer dari ModuleTemplate.schema (wire ke schema)", "Scratch editor Tiptap + autosave (wire ke Supabase)", "Curated library: FTS search + fork (wire ke Supabase)", "Module status flow: draft → published → archived"] },
  { version: "0.4.0", date: "TBD — Week 7", type: "planned", label: "AI Agent Layer", changes: ["6 Tier 2 agents + Orchestrator", "SSE streaming real-time checklist progress", "AI quota enforcement per plan", "Error handling + retry 3x exponential backoff", "Resume endpoint (skip completed steps)", "Scratch + AI Assist 4 mode per section", "Rate limiting per IP + user_id"] },
  { version: "0.5.0", date: "TBD — Week 9", type: "planned", label: "Versioning & Migration", changes: ["Admin panel internal (super_admin)", "CurriculumVersion + ModuleTemplate CRUD + JSON editor", "Edge Function auto-migrate (batch 50, partial failure safe)", "Migration diff review UI (before/after, needs_input inline edit)", "Notifikasi in-app + email migration_ready"] },
  { version: "0.6.0", date: "TBD — Week 11", type: "planned", label: "Billing & Export", changes: ["Xendit integration: subscription + payment link + webhook handler idempotent", "Grace period 3 hari past_due sebelum suspend", "Top-up flow Rp 5.000 = +3 modul Full AI", "Invoice PDF React-PDF: BOS compliance NPWP + PPN 11% + sequential number", "Upload Storage + Resend delivery otomatis", "Modul export Puppeteer: A4 format Kemendikbud, watermark free tier", "8 email templates React Email", "Billing settings page lengkap"] },
  { version: "1.0.0", date: "TBD — Week 12", type: "planned", label: "Production Ready", changes: ["School plan: kepala sekolah dashboard + guru invite flow", "Laporan compliance kurikulum per guru", "Branding sekolah di PDF export", "Subdomain routing (sman1bdg.modulajar.app)", "Sentry error tracking Next.js + Elysia", "AI cost daily cron + anomali alert", "Audit log semua major actions", "Admin business dashboard: MRR, conversion, AI cost, churn", "Full regression testing di staging → launch"] },
];

const Badge = ({ label, color, bg }) => (
  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color, letterSpacing: 0.3, whiteSpace: "nowrap" }}>{label}</span>
);
const P = { P0: { color: "#EF4444", bg: "#3D1515", label: "P0 Critical" }, P1: { color: "#F59E0B", bg: "#2D1F06", label: "P1 High" }, P2: { color: "#64748B", bg: "#1E293B", label: "P2 Normal" } };
const S = { accepted: { color: "#10B981", bg: "#0A2918", label: "✓ Accepted" }, pending: { color: "#F59E0B", bg: "#2D1F06", label: "⏳ Pending" } };
const C = { planning: { color: "#818CF8", bg: "#1E1B4B", label: "Decision" }, planned: { color: "#475569", bg: "#1E293B", label: "Planned" }, done: { color: "#10B981", bg: "#0A2918", label: "Released" }, "in_progress": { color: "#3B82F6", bg: "#1E2B4B", label: "In Progress" } };

export default function App() {
  const [tab, setTab] = useState("decisions");
  const [xD, setXD] = useState(null);
  const [xU, setXU] = useState(null);
  const [xP, setXP] = useState("Phase 0");
  const [xUI, setXUI] = useState(null);

  const tabs = [
    { id: "decisions", label: "📋 ADR (9)" },
    { id: "uncovered", label: "⚠️ Uncovered (12)" },
    { id: "roadmap", label: "🗺️ Roadmap" },
    { id: "ui", label: "🎨 UI Spec (13)" },
    { id: "changelog", label: "📝 Changelog" },
  ];

  const card = { background: "#161B27", border: "1px solid #21293A", borderRadius: 12, overflow: "hidden", marginBottom: 10 };
  const row = { width: "100%", padding: "14px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between" };
  const secTitle = { fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, marginTop: 16 };
  const it = { fontSize: 13, color: "#7A8A9E", marginBottom: 7, display: "flex", gap: 8, lineHeight: 1.65 };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0D1117", color: "#E2E8F0", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      {/* Header */}
      <div style={{ padding: "22px 20px 0", borderBottom: "1px solid #161B27", background: "#0A0E17" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ background: "linear-gradient(135deg,#4338CA,#7C3AED)", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>📚</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#F1F5F9", letterSpacing: -0.5 }}>modulajar.app</div>
              <div style={{ fontSize: 9, color: "#2D3A4E", letterSpacing: 2, fontFamily: "'DM Mono',monospace", textTransform: "uppercase" }}>Complete Project Spec · v0.1.0 · 2025-04-27</div>
            </div>
          </div>
          <div style={{ display: "flex", overflowX: "auto", gap: 0, paddingBottom: 0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "#818CF8" : "#3D5066", borderBottom: tab === t.id ? "2px solid #6366F1" : "2px solid transparent", whiteSpace: "nowrap", fontFamily: "inherit", transition: "color 0.15s" }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 14px 60px" }}>

        {/* ADR */}
        {tab === "decisions" && <>
          <p style={{ color: "#3D5066", fontSize: 12, margin: "0 0 14px" }}>9 Architecture Decision Records. Context → decision → consequences → alternatives.</p>
          {DECISIONS.map(d => (
            <div key={d.id} style={card}>
              <button style={row} onClick={() => setXD(xD === d.id ? null : d.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#2D3A4E", flexShrink: 0 }}>{d.id}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#E2E8F0" }}>{d.title}</span>
                  <Badge {...S[d.status]} />
                </div>
                <span style={{ color: "#6366F1", fontSize: 18, marginLeft: 10, flexShrink: 0 }}>{xD === d.id ? "−" : "+"}</span>
              </button>
              {xD === d.id && <div style={{ borderTop: "1px solid #161B27", padding: "14px 18px" }}>
                <div style={secTitle}>Context</div>
                <p style={{ fontSize: 13, color: "#7A8A9E", lineHeight: 1.7, margin: "0 0 4px" }}>{d.context}</p>
                <div style={secTitle}>Decision</div>
                <p style={{ fontSize: 13, color: "#B0BEC5", lineHeight: 1.7, margin: "0 0 4px" }}>{d.decision}</p>
                <div style={secTitle}>Consequences</div>
                {d.consequences.map((c, i) => <div key={i} style={it}><span style={{ color: "#4F46E5", flexShrink: 0 }}>→</span>{c}</div>)}
                <div style={secTitle}>Alternatives Considered</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {d.alternatives.map(a => <span key={a} style={{ background: "#1A2130", color: "#3D5066", padding: "3px 10px", borderRadius: 6, fontSize: 12 }}>{a}</span>)}
                </div>
              </div>}
            </div>
          ))}
        </>}

        {/* UNCOVERED */}
        {tab === "uncovered" && <>
          <p style={{ color: "#3D5066", fontSize: 12, margin: "0 0 14px" }}>12 area teknis — fully specced. P0 sebelum launch, P1 sebelum v1.0, P2 setelah v1.0.</p>
          {UNCOVERED.map(u => (
            <div key={u.area} style={card}>
              <button style={row} onClick={() => setXU(xU === u.area ? null : u.area)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Badge {...P[u.priority]} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#E2E8F0" }}>{u.area}</span>
                  <span style={{ fontSize: 10, color: "#2D3A4E", fontFamily: "'DM Mono',monospace" }}>{u.owner}</span>
                </div>
                <span style={{ color: "#6366F1", fontSize: 18, marginLeft: 10, flexShrink: 0 }}>{xU === u.area ? "−" : "+"}</span>
              </button>
              {xU === u.area && <div style={{ borderTop: "1px solid #161B27", padding: "14px 18px" }}>
                <p style={{ fontSize: 13, color: "#7A8A9E", lineHeight: 1.7, margin: "0 0 8px" }}>{u.desc}</p>
                {u.sections.map(sec => (
                  <div key={sec.title}>
                    <div style={secTitle}>{sec.title}</div>
                    {sec.items.map((item, i) => (
                      <div key={i} style={it}>
                        <span style={{ color: "#2D3A4E", fontFamily: "'DM Mono',monospace", fontSize: 10, minWidth: 16, flexShrink: 0, paddingTop: 2 }}>{i + 1}.</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>}
            </div>
          ))}
        </>}

        {/* ROADMAP */}
        {tab === "roadmap" && <>
          <p style={{ color: "#3D5066", fontSize: 12, margin: "0 0 14px" }}>5 phase, ~12 minggu. Tiap phase = deployable increment ke staging.</p>
          {ROADMAP.map(p => (
            <div key={p.phase} style={{ ...card, borderLeft: `3px solid ${p.color}` }}>
              <button style={row} onClick={() => setXP(xP === p.phase ? null : p.phase)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: p.color }}>{p.phase}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#E2E8F0" }}>{p.title}</span>
                  <span style={{ fontSize: 11, color: "#2D3A4E" }}>{p.weeks}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#2D3A4E", fontFamily: "'DM Mono',monospace" }}>{p.items.length} tasks</span>
                  <span style={{ color: p.color, fontSize: 18 }}>{xP === p.phase ? "−" : "+"}</span>
                </div>
              </button>
              {xP === p.phase && <div style={{ borderTop: "1px solid #161B27", padding: "12px 18px 16px" }}>
                {p.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 9, alignItems: "flex-start" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid #21293A`, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: "#7A8A9E", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>}
            </div>
          ))}
        </>}

        {/* UI SPEC */}
        {tab === "ui" && <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {[["Font", "Plus Jakarta Sans"], ["Primary", "#4F46E5"], ["Accent", "#F59E0B"], ["Success", "#10B981"], ["Danger", "#EF4444"]].map(([l, v]) => (
              <div key={l} style={{ background: "#161B27", border: "1px solid #21293A", borderRadius: 8, padding: "4px 10px", display: "flex", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#3D5066" }}>{l}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#7A8A9E", fontFamily: "'DM Mono',monospace" }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ color: "#3D5066", fontSize: 12, margin: "0 0 14px" }}>13 screens. Components + states + mobile behavior per screen.</p>
          {UI_SPEC.map(s => (
            <div key={s.screen} style={card}>
              <button style={row} onClick={() => setXUI(xUI === s.screen ? null : s.screen)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#E2E8F0" }}>{s.screen}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#6366F1" }}>{s.route}</span>
                </div>
                <span style={{ color: "#6366F1", fontSize: 18, marginLeft: 10, flexShrink: 0 }}>{xUI === s.screen ? "−" : "+"}</span>
              </button>
              {xUI === s.screen && <div style={{ borderTop: "1px solid #161B27", padding: "14px 18px" }}>
                <p style={{ fontSize: 13, color: "#7A8A9E", margin: "0 0 10px", lineHeight: 1.7 }}>{s.desc}</p>
                <div style={secTitle}>Components</div>
                {s.components.map((c, i) => <div key={i} style={it}><span style={{ color: "#6366F1", flexShrink: 0 }}>•</span>{c}</div>)}
                <div style={secTitle}>States</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {s.states.map(st => <span key={st} style={{ background: "#1A2130", color: "#3D5066", padding: "3px 10px", borderRadius: 6, fontSize: 12 }}>{st}</span>)}
                </div>
                <div style={secTitle}>Mobile</div>
                <div style={{ fontSize: 13, color: "#7A8A9E" }}>{s.mobile}</div>
              </div>}
            </div>
          ))}
        </>}

        {/* CHANGELOG */}
        {tab === "changelog" && <>
          <p style={{ color: "#3D5066", fontSize: 12, margin: "0 0 20px" }}>Semantic versioning. v0.1.0 = planning done. v1.0.0 = production launch.</p>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 18, top: 0, bottom: 0, width: 1, background: "#161B27" }} />
            {CHANGELOG.map((c, idx) => (
              <div key={c.version} style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: idx === 0 ? "#4338CA" : "#0D1117", border: `2px solid ${idx === 0 ? "#6366F1" : "#21293A"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: idx === 0 ? "#C7D2FE" : "#2D3A4E", zIndex: 1 }}>
                  v{c.version.split(".")[0]}
                </div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>v{c.version}</span>
                    <Badge {...C[c.type]} />
                    <span style={{ fontWeight: 600, fontSize: 12, color: "#7A8A9E" }}>{c.label}</span>
                    <span style={{ fontSize: 10, color: "#2D3A4E", fontFamily: "'DM Mono',monospace", marginLeft: "auto" }}>{c.date}</span>
                  </div>
                  <div style={{ background: "#161B27", borderRadius: 10, padding: "12px 16px", border: "1px solid #21293A" }}>
                    {c.changes.map((ch, i) => <div key={i} style={{ fontSize: 12, color: "#7A8A9E", marginBottom: 6, display: "flex", gap: 8, lineHeight: 1.6 }}><span style={{ color: "#2D3A4E", flexShrink: 0 }}>–</span>{ch}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>}

      </div>
    </div>
  );
}
