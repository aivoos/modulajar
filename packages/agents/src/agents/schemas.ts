// Agent Zod schemas + context types (AgentBase lives in base.ts)
// Ref: modulajar-master-v3.jsx
import { z } from "zod";

// ── Shared context passed through orchestrator chain ─────────────
export interface ModuleGenerationContext {
  userId: string;
  plan: string;            // "free" | "go" | "plus" | "sekolah" — determines AI model tier
  subject: string;
  phase: string;
  grade: string;
  topik: string;
  durationMinutes: number;
  learningStyle: "visual" | "auditori" | "kinestetik" | "campuran";
  catatan?: string;
  curriculumVersionId: string;
  moduleId: string;
  teachingClassId?: string;
}

// ── CP Agent output ───────────────────────────────────────────────
export const CpAgentOutputSchema = z.object({
  cp_list: z.array(z.object({
    elemen: z.string().describe("Nama elemen CP (misal: 'Aljabar dan Penalaran')"),
    sub_elemen: z.string().optional().describe("Sub-elemen jika ada"),
    deskripsi_cp: z.string().describe("Deskripsi capaian pembelajaran lengkap dari kurikulum"),
  })),
  summary: z.string().describe("Ringkasan singkat CP untuk mapel dan fase ini"),
});
export type CpAgentOutput = z.infer<typeof CpAgentOutputSchema>;

// ── TP Agent output ──────────────────────────────────────────────
export const TpAgentOutputSchema = z.object({
  tujuan_pembelajaran: z.array(z.object({
    tp_code: z.string().describe("Kode unik, misal 'TP-1', 'TP-2'"),
    elemen: z.string().describe("Elemen CP yang menjadi acuan"),
    uraian: z.string().describe("Uraian Tujuan Pembelajaran format ABCD"),
    kata_kerja: z.string().describe("Kata kerja operasional yang digunakan (Bloom's level)"),
    bloom_level: z.enum(["mengingat", "memahami", "menerapkan", "menganalisis", "mengevaluasi", "mencipta"]),
  })),
  cp_mapping: z.record(z.string(), z.string()).describe("Mapping: tp_code -> elemen CP yang dirujuk"),
  jumlah_tp: z.number().describe("Total jumlah TP yang dihasilkan"),
});
export type TpAgentOutput = z.infer<typeof TpAgentOutputSchema>;

// ── ATP Agent output ─────────────────────────────────────────────
export const AtpAgentOutputSchema = z.object({
  alur_tp: z.array(z.object({
    minggu_ke: z.number().int().positive(),
    tp_codes: z.array(z.string()).describe("Daftar TP yang dibahas di minggu ini"),
    alokasi_minggu: z.number().int().positive().describe("Berapa minggu untuk TP ini"),
    ringkasan_minggu: z.string().describe("Ringkasan kegiatan mingguan untuk modul ajar"),
  })),
  total_minggu: z.number().int().positive(),
  durasi_modul_menit: z.number().int().positive(),
});
export type AtpAgentOutput = z.infer<typeof AtpAgentOutputSchema>;

// ── Activity Agent output ────────────────────────────────────────
export const LearningActivitySchema = z.object({
  fase_kegiatan: z.enum(["pendahuluan", "inti", "penutup"]),
  durasi_menit: z.number().int().positive(),
  kegiatan_guru: z.string().describe("Uraian kegiatan guru dengan detail"),
  kegiatan_siswa: z.string().describe("Uraian kegiatan siswa dengan detail"),
  media_bahan: z.array(z.string()).describe("Daftar media dan bahan yang dibutuhkan"),
  pertanyaan_pengantar: z.array(z.string()).optional().describe("Pertanyaan pengantar untuk membuka kegiatan"),
});

export const AtpStepSchema = z.object({
  minggu_ke: z.number(),
  tp_codes: z.array(z.string()),
  activities: z.array(LearningActivitySchema),
  differentiations: z.record(z.enum(["visual", "auditori", "kinestetik", "campuran"]), z.object({
    modifikasi_kegiatan: z.string(),
    media_alternatif: z.array(z.string()),
  })),
  asesmen_formatif: z.object({
    instrumen: z.string(),
    rubrik: z.string(),
    butir_soal: z.array(z.string()),
  }),
});

export const ActivityAgentOutputSchema = z.object({
  atp_steps: z.array(AtpStepSchema),
  total_minggu: z.number(),
  differentiations_applied: z.boolean(),
});
export type ActivityAgentOutput = z.infer<typeof ActivityAgentOutputSchema>;

// ── Asesmen Agent output ──────────────────────────────────────────
export const AsesmenAgentOutputSchema = z.object({
  diagnostik: z.object({
    tujuan: z.string(),
    instrumen: z.array(z.object({
      no: z.number(),
      soal: z.string(),
      kunci_jawaban: z.string(),
      tingkat_kesulitan: z.enum(["mudah", "sedang", "sulit"]),
    })),
    rubrik_penilaian: z.string(),
  }),
  formatif: z.object({
    tujuan: z.string(),
    instrumen: z.array(z.object({
      no: z.number(),
      soal: z.string(),
      tipe_soal: z.enum(["PG", "isian_singkat", "uraian"]),
      options: z.array(z.string()).optional().describe("Untuk PG saja"),
      kunci_jawaban: z.string(),
      rubrik: z.string().optional(),
      tp_code: z.string(),
      tingkat_kesulitan: z.enum(["mudah", "sedang", "sulit"]),
    })),
  }),
  sumatif: z.object({
    tujuan: z.string(),
    instrumen: z.array(z.object({
      no: z.number(),
      soal: z.string(),
      tipe_soal: z.enum(["PG", "isian_singkat", "uraian", "benar_salah"]),
      options: z.array(z.string()).optional(),
      kunci_jawaban: z.string(),
      rubrik: z.string().optional(),
      tp_code: z.string(),
      tingkat_kesulitan: z.enum(["mudah", "sedang", "sulit"]),
    })),
    rubrik_holistik: z.string().describe("Rubrik penilian holistik untuk sumatif"),
  }),
});
export type AsesmenAgentOutput = z.infer<typeof AsesmenAgentOutputSchema>;

// ── Validator output ─────────────────────────────────────────────
export const ValidationIssueSchema = z.object({
  section: z.string(),
  field: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  message: z.string(),
  suggestion: z.string().optional(),
});

export const ValidatorOutputSchema = z.object({
  is_valid: z.boolean(),
  score: z.number().min(0).max(100).describe("Kelengkapan modul (0-100)"),
  issues: z.array(ValidationIssueSchema),
  missing_required: z.array(z.string()).describe("Field wajib yang belum terisi"),
  summary: z.string(),
});
export type ValidatorOutput = z.infer<typeof ValidatorOutputSchema>;

// ── Prota Agent output ──────────────────────────────────────────────
export const ProtaAgentOutputSchema = z.object({
  title: z.string(),
  tahun_ajaran: z.string(),
  mapel: z.string(),
  fase: z.string(),
  kelas: z.string(),
  ringkasan: z.string().optional(),
  semester: z.array(z.object({
    semester: z.number().int().positive(),
    minggu_efektif: z.number().int().positive(),
    alokasi_tp: z.array(z.object({
      tp_kode: z.string(),
      elemen: z.string(),
      alokasi_minggu: z.array(z.number().int().positive()),
      capaian_minggu: z.string(),
    })),
    ringkasan_semester: z.string(),
  })),
  catatan: z.string().optional(),
});
export type ProtaAgentOutput = z.infer<typeof ProtaAgentOutputSchema>;

// ── Promes Agent output ──────────────────────────────────────────
export const PromesAgentOutputSchema = z.object({
  title: z.string(),
  tahun_ajaran: z.string(),
  semester: z.number().int().positive(),
  mapel: z.string(),
  fase: z.string(),
  kelas: z.string(),
  ringkasan: z.string().optional(),
  minggu_efektif: z.number().int().positive(),
  alur_mingguan: z.array(z.object({
    minggu_ke: z.number().int().positive(),
    tp_kodes: z.array(z.string()),
    elemen: z.string(),
    topik: z.string(),
    kegiatan_inti: z.string(),
    alokasi_jam: z.number().int().positive(),
    capaian: z.string(),
  })),
  penilaian: z.object({
    formatif: z.string(),
    sumatif: z.string(),
  }).optional(),
  catatan: z.string().optional(),
});
export type PromesAgentOutput = z.infer<typeof PromesAgentOutputSchema>;
