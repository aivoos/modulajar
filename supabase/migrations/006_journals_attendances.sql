-- Migration 006: Journals & Attendance
-- Ref: modulajar-master-v3.jsx — Migration 006
BEGIN;

-- Journals (Jurnal Mengajar Harian)
CREATE TABLE journals (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teaching_class_id  uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  academic_year_id   uuid NOT NULL REFERENCES academic_years(id),
  module_id          uuid REFERENCES modules(id) ON DELETE SET NULL,

  date               date NOT NULL DEFAULT CURRENT_DATE,
  topic              text NOT NULL DEFAULT '',

  -- Detail kegiatan (opsional, bisa diisi nanti atau AI-generate dari modul)
  activity_open      text,
  activity_main      text,
  activity_close     text,

  -- Ketercapaian TP hari ini (0-100, estimasi guru)
  tp_achievement     int CHECK(tp_achievement BETWEEN 0 AND 100),
  notes              text,

  -- Dokumentasi
  photo_urls         text[] NOT NULL DEFAULT '{}',

  -- Offline sync support
  is_synced          boolean NOT NULL DEFAULT true,
  client_created_at  timestamptz,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  UNIQUE(teaching_class_id, date)
);

-- Attendances (Absensi per siswa per jurnal)
CREATE TABLE attendances (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id  uuid NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status      attendance_status NOT NULL DEFAULT 'H',
  notes       text,
  is_synced   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE(journal_id, student_id)
);

-- Indexes
CREATE INDEX idx_journals_user ON journals(user_id);
CREATE INDEX idx_journals_class ON journals(teaching_class_id);
CREATE INDEX idx_journals_year ON journals(academic_year_id);
CREATE INDEX idx_journals_date ON journals(date DESC);
CREATE INDEX idx_journals_class_date ON journals(teaching_class_id, date DESC);
CREATE INDEX idx_journals_unsynced ON journals(user_id, is_synced) WHERE is_synced = false;
CREATE INDEX idx_attendances_journal ON attendances(journal_id);
CREATE INDEX idx_attendances_student ON attendances(student_id);
CREATE INDEX idx_attendances_unsynced ON attendances(journal_id, is_synced) WHERE is_synced = false;

CREATE TRIGGER journals_updated_at BEFORE UPDATE ON journals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;