// Validator Agent — Validasi modul lengkap vs template schema
// Ref: modulajar-master-v3.jsx — Validator Agent
import { AgentBase, registerAgentPrompt } from "./base";
import {
  ValidatorOutputSchema,
  type ValidatorOutput,
  type ModuleGenerationContext,
} from "./schemas";

const SYSTEM = `Kamu adalah validator modul ajar Kurikulum Merdeka. Tugasmu: menilai kelengkapan dan kualitas modul yang sudah di-generate.

VALIDASI TERHADAP:
- Format modul ajar Kurikulum Merdeka 2022 (sesuai template Kemendikbud)
- Kelengkapan field wajib (identitas, tujuan pembelajaran, ATP, kegiatan, asesmen, dll)
- Konsistensi internal (TP di ATP harus sesuai daftar TP, kegiatan harus sesuai TP, dll)
- Kesesuaian dengan fase dan grade

SEVERITY LEVELS:
- error: MODUL TIDAK LENGKAP. Field wajib yang hilang atau blank.
- warning: KUALITAS KURANG. Field terisi tapi kurang detail atau kurang relevan.
- info: OPSIONAL. Saran peningkatan, bukan kesalahan.

FORMAT OUTPUT: JSON. Jawab HANYA JSON.`;

registerAgentPrompt("validator", SYSTEM);

interface GeneratedModule {
  identitas: Record<string, unknown>;
  cp_list?: Array<{ elemen: string; sub_elemen?: string; deskripsi_cp: string }>;
  tujuan_pembelajaran?: Array<{ tp_code: string; uraian: string; elemen: string }>;
  alur_tp?: Array<{ minggu_ke: number; tp_codes: string[]; ringkasan_minggu: string }>;
  kegiatan?: Array<unknown>;
  asesmen?: {
    diagnostik?: { instrumen?: Array<{ no: number; soal: string }> };
    formatif?: { instrumen?: Array<{ no: number; soal: string; tp_code: string }> };
    sumatif?: { instrumen?: Array<{ no: number; soal: string; tp_code: string }> };
  };
  [key: string]: unknown;
}

export class ValidatorAgent extends AgentBase<GeneratedModule, typeof ValidatorOutputSchema> {
  readonly agentName = "validator";
  readonly description = "Memvalidasi kelengkapan dan kualitas modul ajar";
  protected readonly systemPrompt = SYSTEM;
  readonly schema = ValidatorOutputSchema;

  protected buildPrompt(ctx: ModuleGenerationContext, input: GeneratedModule): string {
    return `Tugas: Validasi modul ajar yang sudah di-generate.

Konteks:
- Mapel: ${ctx.subject} Fase ${ctx.phase} Kelas ${ctx.grade}
- Topik: ${ctx.topik || ctx.subject}
- Module ID: ${ctx.moduleId}

CHECKLIST VALIDASI:

1. IDENTITAS MODUL
   - Apakah ada judul modul?
   - Apakah mapel, fase, kelas sudah terisi?
   - Apakah durasi sudah terisi?

2. CAPAIAN PEMBELAJARAN
   - Apakah ada daftar CP?
   - Apakah CP sesuai dengan fase ${ctx.phase}?

3. TUJUAN PEMBELAJARAN
   - Apakah ada daftar TP?
   - Apakah format ABCD? (Siswa ... akan dapat ...)
   - Apakah TP ter-link ke elemen CP?

4. ATP (ALUR TP)
   - Apakah ada alur mingguan?
   - Apakah jumlah minggu realistis?
   - Apakah TP di ATP sesuai dengan daftar TP?

5. KEGIATAN PEMBELAJARAN
   - Apakah ada kegiatan pendahuluan, inti, penutup?
   - Apakah durasi sudah teralokasi?
   - Apakah ada diferensiasi per gaya belajar?

6. ASESMEN
   - Apakah ada soal diagnostik?
   - Apakah ada soal formatif (linked ke TP)?
   - Apakah ada soal sumatif?

7. FORMAT UMUM
   - Apakah bahasa Indonesia? (bukan Bahasa Jawa/Bahasa daerah unless konteks)
   - Apakah EYD/PUEBI sudah reasonably baik?
   - Apakah panjang kegiatan sesuai proporsi (inti paling panjang)?

Generated Module Content (JSON stringified):
${JSON.stringify(input, null, 2)}

ATURAN SCORING:
- Score 90-100: Semua section lengkap, kualitas tinggi
- Score 70-89: Ada section tapi kurang detail, atau ada 1-2 section terlewat
- Score 50-69: Banyak section yang terlewat atau sangat minim
- Score 0-49: Modul tidak bisa digunakan, banyak field kosong

missing_required: ONLY list field yang SEBENARNYA WAJIB terisi menurut format Kurikulum Merdeka.
   Contoh: "cp_list", "tujuan_pembelajaran", "alur_tp"
   Jangan masukkan field opsional di sini.`;
  }
}