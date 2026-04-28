-- Migration 012: Seed Data
-- Ref: modulajar-master-v3.jsx — Migration 012
BEGIN;

-- Curriculum Versions
INSERT INTO curriculum_versions (name, code, year, status) VALUES
  ('Kurikulum 2013', 'K13', 2013, 'deprecated'),
  ('Kurikulum Merdeka 2022', 'MERDEKA_2022', 2022, 'active');

-- App Config
INSERT INTO app_config (key, value, description) VALUES
  ('ai_quota_go',       '{"value": 10}',    'AI quota per bulan untuk Go tier'),
  ('ai_quota_plus',     '{"value": 20}',    'AI quota per bulan untuk Plus tier'),
  ('ai_quota_sekolah',   '{"value": 25}',   'AI quota per guru/bulan untuk Sekolah tier'),
  ('topup_price_idr',   '{"value": 10000}', 'Harga top-up AI credits'),
  ('topup_credits',     '{"value": 3}',      'Jumlah credits per top-up'),
  ('max_modules_free',  '{"value": 2}',      'Maks modul per bulan untuk Free'),
  ('maintenance_mode',  '{"value": false}', 'Toggle maintenance mode'),
  ('maintenance_message', '{"value": "Modulajar sedang dalam pemeliharaan."}', 'Pesan maintenance');

-- Feature Flags
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('full_ai_mode',     true,  'Full AI generate modul'),
  ('curated_library',   true,  'Browse dan fork curated modules'),
  ('plus_tier',         true,  'Plus tier'),
  ('sekolah_tier',      true,  'Sekolah tier'),
  ('journal_feature',   true,  'Jurnal mengajar harian'),
  ('grade_feature',     true,  'Input nilai dan deskripsi'),
  ('pwa_offline',       true,  'Offline mode PWA'),
  ('bukti_pmm',         true,  'Paket Bukti Kinerja PMM'),
  ('bank_soal',         false, 'Bank Soal AI (Sprint 2)');

-- Academic Year aktif (Genap 2025/2026 — semester berjalan April 2026)
INSERT INTO academic_years (label, semester, year, start_date, end_date, is_active, school_id)
VALUES ('2025/2026 Genap', 'genap', 2025, '2026-01-12', '2026-06-13', true, NULL)
ON CONFLICT DO NOTHING;

COMMIT;