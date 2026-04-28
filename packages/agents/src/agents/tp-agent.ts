// TP Agent — Tujuan Pembelajaran ABCD format
// Ref: modulajar-master-v3.jsx — TP Agent + Bloom's Taxonomy
import { AgentBase } from "./base";
import {
  TpAgentOutputSchema,
  type TpAgentOutput,
  type ModuleGenerationContext,
  type CpAgentOutput,
} from "./schemas";

const BLOOM_VERBS = {
  mengingat: ["mengidentifikasi", "menyebutkan", "mendefinisikan", "memperkenalkan", "membandingkan"],
  memahami: ["menjelaskan", "menerangkan", "merangkum", "menafsirkan", "memberi contoh"],
  menerapkan: ["menerapkan", "menggunakan", "menyelesaikan", "memperagakan", "menghitung"],
  menganalisis: ["menganalisis", "membedakan", "mengkategorikan", "memeriksa", "mendeteksi"],
  mengevaluasi: ["mengevaluasi", "menilai", "mempertimbangkan", "memutuskan", "mengkritisi"],
  menciptakan: ["menciptakan", "merancang", "membangun", "menghasilkan", "merumuskan"],
};

const SYSTEM = `Kamu adalah ahli pedagogi Indonesia. Spesialisasimu: menulis Tujuan Pembelajaran (TP) format ABCD.

FORMAT ABCD:
- A (Audience): SISWA — "Siswa Fase [X] kelas [Y]" (JANGAN "Peserta didik" atau "Peserta didik kelas")
- B (Behavior): KATA KERJA OPERASIONAL dari Taksonomi Bloom — gunakan yang sesuai level kognitif
- C (Condition): KONTEKS/SYARAT — materi prasyarat, alat/media yang digunakan, kondisi tertentu
- D (Degree): STANDAR MINIMAL — bagaimana guru mengukur tercapai atau tidak ("minimal 80%", "tepat dan sistematis", dll)

FORMAT OUTPUT: JSON array. SATU TP per elemen CP. Maksimal 12 TP per modul (lebih dari itu berarti modul terlalu luas).
Jawab HANYA JSON.`;

export class TpAgent extends AgentBase<CpAgentOutput, typeof TpAgentOutputSchema> {
  readonly name = "tp_agent";
  readonly description = "Menulis Tujuan Pembelajaran format ABCD dari Capaian Pembelajaran";
  readonly systemPrompt = SYSTEM;
  readonly schema = TpAgentOutputSchema;

  protected buildPrompt(ctx: ModuleGenerationContext, input: CpAgentOutput): string {
    const fase = ctx.phase;
    const kelas = ctx.grade;
    const mapel = ctx.subject;
    const topik = ctx.topik || "(topik tidak ditentukan)";

    const cpList = input.cp_list
      .map((cp, i) => `${i + 1}. ELEMEN: ${cp.elemen}${cp.sub_elemen ? ` / ${cp.sub_elemen}` : ""}\n   CP: ${cp.deskripsi_cp}`)
      .join("\n\n");

    return `Tugas: Tulis Tujuan Pembelajaran (TP) untuk:

Mapel: ${mapel}
Fase: ${fase}
Kelas: ${kelas}
Topik: ${topik}

Capaian Pembelajaran yang relevan:
${cpList}

ATURAN:
1. JANGAN gunakan kata "Peserta didik" — gunakan "Siswa Fase ${fase}"
2. Kata kerja harus sesuai level kognitif yang wajar untuk fase ${fase}
3. Degree harus OBJECTIVE dan UKURAN (bukan "dengan baik" yang tidak terukur)
4. TP harus SPESIFIK ke topik, bukan generik
5. Maksimal 12 TP. Jika CP list > 12, prioritasi yang paling relevan dengan topik.
6. Isi cp_mapping: { "TP-1": "Elemen Aljabar", ... }
7. bloom_level harus sesuai dengan kata kerja yang dipakai

Contoh Degree yang benar: "minimal 80% benar", "tepat dan sistematis", "minimal 3 dari 4 kriteria"
Contoh Degree yang salah: "dengan baik", "secara optimal", "dengan maksimal"`;
  }
}
