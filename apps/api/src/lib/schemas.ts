// Zod schemas for API request validation
// Ref: modulajar-master-v3.jsx — all API routes
import { z } from "zod";

// ── Auth ────────────────────────────────────────────────────────
export const UUIDSchema = z.string().uuid();
export const NonEmptyString = z.string().min(1);

// ── Teaching Class (Day 11) ─────────────────────────────────────
// Ref: teaching_classes table — Migration 003
export const ScheduleEntrySchema = z.object({
  day: z.number().int().min(1).max(7), // 1=Senin … 7=Minggu
  time_start: z.string().min(1),       // "07:00"
  time_end: z.string().min(1),         // "09:00"
});

export const CreateTeachingClassBody = z.object({
  academic_year_id: z.string().uuid(),
  subject: z.string().min(1),
  grade: z.string().max(10),            // text field e.g. "8" or "8A"
  class_name: z.string().min(1).max(10),
  phase: z.enum(["A", "B", "C", "D", "E", "F"]).optional(),
  schedule: z.array(ScheduleEntrySchema).default([]),
});

export const UpdateTeachingClassBody = z.object({
  subject: z.string().min(1).optional(),
  grade: z.string().max(10).optional(),
  class_name: z.string().min(1).max(10).optional(),
  phase: z.enum(["A", "B", "C", "D", "E", "F"]).optional(),
  schedule: z.array(ScheduleEntrySchema).optional(),
  is_active: z.boolean().optional(),
});

// ── Students (Day 12) ───────────────────────────────────────────
export const StudentRowSchema = z.object({
  name: z.string().min(1),
  nis: z.string().optional(),
  gender: z.enum(["L", "P", "l", "p"]).optional(),
});

export const CreateStudentBody = z.object({
  teaching_class_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  nis: z.string().optional(),
  gender: z.enum(["L", "P"]).optional(),
  notes: z.string().optional(),
});

export const ImportStudentsBody = z.object({
  teaching_class_id: z.string().uuid(),
  students: z.array(StudentRowSchema).min(1).max(200),
});

export const UpdateStudentBody = z.object({
  name: z.string().min(1).max(100).optional(),
  nis: z.string().optional(),
  gender: z.enum(["L", "P"]).optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
});

// ── Academic Year ───────────────────────────────────────────────
// Ref: academic_years table — Migration 003
export const CreateAcademicYearBody = z.object({
  label: z.string().min(1).max(50),       // "2025/2026 Genap"
  semester: z.enum(["ganjil", "genap"]),
  year: z.number().int().min(2000).max(2100),
  start_date: z.string(),
  end_date: z.string(),
  is_active: z.boolean().default(false),
  school_id: z.string().uuid().nullable().optional(),
});

export const UpdateAcademicYearBody = CreateAcademicYearBody.partial();

// ── Journals (Days 16-18) ───────────────────────────────────────
export const CreateJournalBody = z.object({
  teaching_class_id: z.string().uuid(),
  module_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid(),
  date: z.string().min(1),  // "YYYY-MM-DD"
  topic: z.string().max(255).optional(),
  activity_summary: z.string().optional(),
  notes: z.string().optional(),
  tp_achievement: z.number().int().min(0).max(100).optional(),
  photo_urls: z.array(z.string().url()).default([]),
  local_id: z.string().optional(),
});

export const UpdateJournalBody = z.object({
  topic: z.string().max(255).optional(),
  activity_summary: z.string().optional(),
  notes: z.string().optional(),
  tp_achievement: z.number().int().min(0).max(100).optional(),
  photo_urls: z.array(z.string().url()).optional(),
});

export const SyncJournalsBody = z.object({
  journals: z.array(z.object({
    teaching_class_id: z.string().uuid(),
    academic_year_id: z.string().uuid(),
    date: z.string(),
    topic: z.string().optional(),
    activity_summary: z.string().optional(),
    notes: z.string().optional(),
    tp_achievement: z.number().optional(),
    local_id: z.string(),
  })).min(1).max(50),
});

// ── Attendances (Day 17) ────────────────────────────────────────
export const AttendanceEntrySchema = z.object({
  student_id: z.string().uuid(),
  status: z.enum(["H", "S", "I", "A"]),
  notes: z.string().optional(),
});

export const BatchAttendanceBody = z.object({
  journal_id: z.string().uuid(),
  attendances: z.array(AttendanceEntrySchema).min(1).max(200),
});

// ── Grade Entries (Day 19) ─────────────────────────────────────
export const CreateGradeEntryBody = z.object({
  teaching_class_id: z.string().uuid(),
  student_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
  tp_code: z.string().min(1),
  assessment_type: z.enum(["formatif", "sumatif"]),
  score: z.number().min(0).max(100).optional(),
  label: z.string().optional(),
  notes: z.string().optional(),
  assessed_at: z.string().min(1),
});

export const BatchGradeEntriesBody = z.object({
  teaching_class_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
  entries: z.array(z.object({
    student_id: z.string().uuid(),
    tp_code: z.string(),
    assessment_type: z.enum(["formatif", "sumatif"]),
    score: z.number().min(0).max(100).optional(),
    label: z.string().optional(),
    notes: z.string().optional(),
    assessed_at: z.string(),
  })).min(1).max(1000),
});

// ── Grade Summaries (Day 20, ADR-010) ───────────────────────────
export const UpdateGradeSummaryBody = z.object({
  final_score: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  is_final: z.boolean().optional(),
});

// ── Questions (Day 27) ───────────────────────────────────────────
export const CreateQuestionBody = z.object({
  module_id: z.string().uuid().optional(),
  type: z.enum(["PG", "isian_singkat", "uraian", "benar_salah"]),
  content: z.string().min(1),
  options: z.array(z.object({ value: z.string(), text: z.string() })).optional(),
  answer: z.string().optional(),
  rubric: z.string().optional(),
  tp_code: z.string().optional(),
  difficulty: z.enum(["mudah", "sedang", "sulit"]).default("sedang"),
  is_public: z.boolean().default(false),
});

export const UpdateQuestionBody = CreateQuestionBody.partial();

// ── Question Sets ───────────────────────────────────────────────
export const CreateQuestionSetBody = z.object({
  module_id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  question_ids: z.array(z.string().uuid()).default([]),
  kisi_kisi: z.array(z.object({
    tp_code: z.string(),
    level: z.string(),
    question_count: z.number().int().positive(),
  })).optional(),
  is_public: z.boolean().default(false),
});

export const UpdateQuestionSetBody = CreateQuestionSetBody.partial();

// ── Module schemas ───────────────────────────────────────────────
// Ref: modules table — Migration 005
export const CreateModuleBody = z.object({
  title: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).optional(),
  phase: z.enum(["A", "B", "C", "D", "E", "F"]).optional(),
  grade: z.string().max(10).optional(),  // text field e.g. "8"
  duration_minutes: z.number().int().min(1).optional(),  // default 80
  mode: z.enum(["full_ai", "curated", "scratch"]).default("scratch"),
  curriculum_version_id: z.string().uuid().optional(),
  template_id: z.string().uuid().optional(),
  teaching_class_id: z.string().uuid().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateModuleBody = z.object({
  title: z.string().min(1).max(255).optional(),
  subject: z.string().optional(),
  phase: z.enum(["A", "B", "C", "D", "E", "F"]).optional(),
  grade: z.string().max(10).optional(),
  duration_minutes: z.number().int().min(1).optional(),
  mode: z.enum(["full_ai", "curated", "scratch"]).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  is_public: z.boolean().optional(),
  is_curated: z.boolean().optional(),
});

// ── Subscription schemas ─────────────────────────────────────────
export const UpgradeBody = z.object({
  plan: z.enum(["go", "plus", "sekolah"]),
  billing_cycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

// ── AI Agent schemas ─────────────────────────────────────────────
export const GenerateBody = z.object({
  subject: z.string().min(1),
  phase: z.enum(["A","B","C","D","E","F"]),
  grade: z.string().min(1).max(10),           // e.g. "10" — text field per DB schema
  topik: z.string().optional(),
  duration_minutes: z.number().int().min(1).max(960).default(80), // default 80 menit per spec
  learning_style: z.enum(["visual","auditori","kinestetik","campuran"]).default("campuran"),
  catatan: z.string().optional(),
  curriculum_version_id: z.string().uuid().optional(),
  module_id: z.string().uuid().optional(),   // existing module to update (for retry)
});

export const AssistBody = z.object({
  module_id: z.string().uuid(),
  section: z.string().min(1),
  mode: z.enum(["suggest", "improve", "generate", "check"]),
  current_content: z.string().optional(),
});

// ── Library ─────────────────────────────────────────────────────
export const ForkModuleBody = z.object({
  module_id: z.string().uuid(),
});

// ── Xendit webhook schema ────────────────────────────────────────
export const XenditWebhookPayload = z.object({
  id: z.string().min(1),
  event: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
});

// ── Error response ──────────────────────────────────────────────
export const ErrorResponse = z.object({
  error: z.string(),
  message: z.string().optional(),
});

// ── Type exports ────────────────────────────────────────────────
export type CreateModuleInput = z.infer<typeof CreateModuleBody>;
export type UpdateModuleInput = z.infer<typeof UpdateModuleBody>;
export type GenerateInput = z.infer<typeof GenerateBody>;
export type UpgradeInput = z.infer<typeof UpgradeBody>;
export type XenditPayload = z.infer<typeof XenditWebhookPayload>;
export type CreateTeachingClassInput = z.infer<typeof CreateTeachingClassBody>;
export type UpdateTeachingClassInput = z.infer<typeof UpdateTeachingClassBody>;
export type CreateStudentInput = z.infer<typeof CreateStudentBody>;
export type UpdateStudentInput = z.infer<typeof UpdateStudentBody>;
export type ImportStudentsInput = z.infer<typeof ImportStudentsBody>;
export type CreateJournalInput = z.infer<typeof CreateJournalBody>;
export type UpdateJournalInput = z.infer<typeof UpdateJournalBody>;
export type SyncJournalsInput = z.infer<typeof SyncJournalsBody>;
export type BatchAttendanceInput = z.infer<typeof BatchAttendanceBody>;
export type CreateGradeEntryInput = z.infer<typeof CreateGradeEntryBody>;
export type BatchGradeEntriesInput = z.infer<typeof BatchGradeEntriesBody>;
export type UpdateGradeSummaryInput = z.infer<typeof UpdateGradeSummaryBody>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionBody>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionBody>;
export type CreateQuestionSetInput = z.infer<typeof CreateQuestionSetBody>;
export type UpdateQuestionSetInput = z.infer<typeof UpdateQuestionSetBody>;
export type CreateAcademicYearInput = z.infer<typeof CreateAcademicYearBody>;
export type AssistInput = z.infer<typeof AssistBody>;
export type ForkModuleInput = z.infer<typeof ForkModuleBody>;