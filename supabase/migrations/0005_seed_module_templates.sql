-- Day 11: Seed — ModuleTemplates K13 & Merdeka
-- Ref: modulajar-docs.jsx → Roadmap Phase 0
-- Migration: 0005_seed_module_templates.sql

BEGIN;

DO $$
DECLARE
  merdeka_id uuid;
  k13_id uuid;
BEGIN
  SELECT id INTO merdeka_id FROM curriculum_versions WHERE kurikulum = 'merdeka_2022' LIMIT 1;
  SELECT id INTO k13_id FROM curriculum_versions WHERE kurikulum = 'k13' LIMIT 1;

  -- ── Modul Ajar Template — Merdeka ─────────────────────────────
  INSERT INTO module_templates (curriculum_version_id, name, schema, migration_rules)
  VALUES
    (merdeka_id, 'Modul Ajar Merdeka SMA',
     '{"sections": [
       {"id": "identitas", "title": "Identitas Modul", "order": 1, "fields": [
         {"key": "nama_kegiatan", "label": "Nama Kegiatan", "type": "text", "required": true},
         {"key": "kelas", "label": "Kelas", "type": "text", "required": true},
         {"key": "fase", "label": "Fase", "type": "text", "required": true},
         {"key": "alokasi_waktu", "label": "Alokasi Waktu", "type": "text", "required": true}
       ]},
       {"id": "cp", "title": "Capaian Pembelajaran", "order": 2, "fields": [
         {"key": "cp_text", "label": "Capaian Pembelajaran", "type": "textarea", "required": true}
       ]},
       {"id": "tp", "title": "Tujuan Pembelajaran", "order": 3, "fields": [
         {"key": "tujuan_list", "label": "Tujuan Pembelajaran (ABCD format)", "type": "textarea", "required": true,
          "hint": "Gunakan format: Audience, Behavior, Condition, Degree"}
       ]},
       {"id": "atp", "title": "Alur Tujuan Pembelajaran", "order": 4, "fields": [
         {"key": "atp_weeks", "label": "Alur per Minggu", "type": "table", "required": true,
          "columns": ["Minggu", "Materi", "Indikator", "Alokasi"]}
       ]},
       {"id": "pemahaman", "title": "Pemahaman Bermakna", "order": 5, "fields": [
         {"key": "pemahaman_text", "label": "Pemahaman Bermakna", "type": "textarea", "required": true}
       ]},
       {"id": "pertanyaan", "title": "Pertanyaan Pemantik", "order": 6, "fields": [
         {"key": "pertanyaan_list", "label": "Pertanyaan Pemantik", "type": "textarea", "required": true,
          "hint": "Tulislah pertanyaan yang memicu curiosity siswa"}
       ]},
       {"id": "kegiatan", "title": "Kegiatan Pembelajaran", "order": 7, "sections": [
         {"id": "keg_pendahuluan", "title": "Pendahuluan", "fields": [
           {"key": "keg_pend_activities", "label": "Aktivitas Pendahuluan", "type": "textarea"}
         ]},
         {"id": "keg_inti", "title": "Inti", "fields": [
           {"key": "keg_inti_activities", "label": "Aktivitas Pembelajaran", "type": "textarea"},
           {"key": "diferensiasi", "label": "Diferensiasi (Visual/Auditori/Kinestetik)", "type": "textarea"}
         ]},
         {"id": "keg_penutup", "title": "Penutup", "fields": [
           {"key": "keg_pen_activities", "label": "Aktivitas Penutup", "type": "textarea"}
         ]}
       ]},
       {"id": "asesmen", "title": "Asesmen", "order": 8, "fields": [
         {"key": "asesmen_formatif", "label": "Asesmen Formatif", "type": "textarea", "required": true},
         {"key": "asesmen_sumatif", "label": "Asesmen Sumatif", "type": "textarea"},
         {"key": "remedi", "label": "Remedial", "type": "textarea"},
         {"key": "pengayaan", "label": "Pengayaan", "type": "textarea"}
       ]},
       {"id": "refleksi", "title": "Refleksi", "order": 9, "fields": [
         {"key": "refleksi_guru", "label": "Refleksi Guru", "type": "textarea"},
         {"key": "refleksi_siswa", "label": "Refleksi Siswa", "type": "textarea"}
       ]},
       {"id": "lampiran", "title": "Lampiran", "order": 10, "fields": [
         {"key": "lkpd", "label": "LKPD / Lembar Kerja", "type": "textarea"},
         {"key": "bahan_ajar", "label": "Bahan Ajar", "type": "textarea"}
       ]}
     ]}',
     '{"field_map": {"cp_text": "capaian_pembelajaran", "tujuan_list": "tujuan_pembelajaran"}}'),
    (merdeka_id, 'Modul Ajar Merdeka SMP',
     '{"sections": [
       {"id": "identitas", "title": "Identitas Modul", "order": 1, "fields": [
         {"key": "nama_kegiatan", "label": "Nama Kegiatan", "type": "text", "required": true},
         {"key": "kelas", "label": "Kelas / Semester", "type": "text", "required": true},
         {"key": "fase", "label": "Fase", "type": "text", "required": true},
         {"key": "alokasi_waktu", "label": "Alokasi Waktu", "type": "text", "required": true}
       ]},
       {"id": "cp", "title": "Capaian Pembelajaran", "order": 2, "fields": [
         {"key": "cp_text", "label": "Capaian Pembelajaran", "type": "textarea", "required": true}
       ]},
       {"id": "tp", "title": "Tujuan Pembelajaran", "order": 3, "fields": [
         {"key": "tujuan_list", "label": "Tujuan Pembelajaran (ABCD)", "type": "textarea", "required": true}
       ]},
       {"id": "atp", "title": "Alur Tujuan Pembelajaran", "order": 4, "fields": [
         {"key": "atp_weeks", "label": "Alur per Minggu", "type": "table", "columns": ["Minggu", "Materi Pokok", "JP"]}
       ]},
       {"id": "kegiatan", "title": "Kegiatan Pembelajaran", "order": 5, "fields": [
         {"key": "keg_pendahuluan", "label": "Pendahuluan", "type": "textarea"},
         {"key": "keg_inti", "label": "Inti", "type": "textarea"},
         {"key": "keg_penutup", "label": "Penutup", "type": "textarea"},
         {"key": "diferensiasi", "label": "Diferensiasi", "type": "textarea"}
       ]},
       {"id": "asesmen", "title": "Asesmen", "order": 6, "fields": [
         {"key": "formatif", "label": "Asesmen Formatif", "type": "textarea"},
         {"key": "sumatif", "label": "Asesmen Sumatif", "type": "textarea"}
       ]}
     ]}',
     NULL);

  -- ── Modul Ajar Template — K13 ────────────────────────────────
  INSERT INTO module_templates (curriculum_version_id, name, schema, migration_rules)
  VALUES
    (k13_id, 'RPP K13 SMA',
     '{"sections": [
       {"id": "identitas", "title": "Identitas", "order": 1, "fields": [
         {"key": "sekolah", "label": "Sekolah", "type": "text"},
         {"key": "mata_pelajaran", "label": "Mata Pelajaran", "type": "text"},
         {"key": "kelas", "label": "Kelas / Semester", "type": "text"},
         {"key": "kompetensi_dasar", "label": "Kompetensi Dasar", "type": "textarea"},
         {"key": "indikator", "label": "Indikator Pencapaian Kompetensi", "type": "textarea"}
       ]},
       {"id": "tujuan", "title": "Tujuan Pembelajaran", "order": 2, "fields": [
         {"key": "tujuan_text", "label": "Tujuan", "type": "textarea", "required": true}
       ]},
       {"id": "model", "title": "Model Pembelajaran", "order": 3, "fields": [
         {"key": "model_pembelajaran", "label": "Model / Metode", "type": "text"}
       ]},
       {"id": "kegiatan", "title": "Kegiatan Pembelajaran", "order": 4, "fields": [
         {"key": "keg_pendahuluan", "label": "Pendahuluan", "type": "textarea"},
         {"key": "keg_inti", "label": "Inti", "type": "textarea"},
         {"key": "keg_penutup", "label": "Penutup", "type": "textarea"}
       ]},
       {"id": "penilaian", "title": "Penilaian", "order": 5, "fields": [
         {"key": "teknik", "label": "Teknik Penilaian", "type": "textarea"},
         {"key": "instrumen", "label": "Instrumen Penilaian", "type": "textarea"}
       ]},
       {"id": "sumber", "title": "Sumber Belajar", "order": 6, "fields": [
         {"key": "sumber_belajar", "label": "Sumber", "type": "textarea"}
       ]}
     ]}',
     NULL);

END $$;

COMMIT;