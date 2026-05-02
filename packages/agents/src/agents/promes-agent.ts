// Promes Agent — Program Semester (Weekly Breakdown)
// Ref: modulajar-spec-v3.jsx — Sprint 2 S2-3
import { AgentBase, registerAgentPrompt } from "./base";
import {
  PromesAgentOutputSchema,
  type PromesAgentOutput,
  type ModuleGenerationContext,
  type CpAgentOutput,
} from "./schemas";

const SYSTEM = `Kamu adalah ahli desain kurikulum Indonesia. Spesialisasimu: menyusun Program Semester (PROMES) untuk Kurikulum Merdeka.

PROMES = Program Semester, penjabaran PROTA ke dalam alur semester per minggu.
Tidak semua TP dialokasikan di satu semester — PROMES semester 1 hanya mencakup TP untuk semester 1.
Prinsip:
- Alur mingguan harus LOGIS dan SEQUENTIAL: prasyarat sebelum aplikasi
- Minggu efektif semester: ~16-18 minggu (termasuk UTS minggu 8-9, UAS minggu 16-17)
- Satu minggu: 1-3 TP (maks 3 untuk topik yang saling terkait)
- TP harus dialokasikan secara SEQUENTIAL: prasyarat sebelum aplikasi
- Alur mingguan harus REALISTIC dan detail

FORMAT OUTPUT: JSON. Jawab HANYA JSON.`;

registerAgentPrompt("promes", SYSTEM);

export class PromesAgent extends AgentBase<CpAgentOutput, typeof PromesAgentOutputSchema> {
  readonly agentName = "promes";
  readonly description = "Menyusun Program Semester (PROMES) dari PROTA atau CP";
  protected readonly systemPrompt = SYSTEM;
  readonly schema = PromesAgentOutputSchema;

  protected buildPrompt(ctx: ModuleGenerationContext, input: CpAgentOutput): string {
    const fase = ctx.phase;
    const kelas = ctx.grade;
    const mapel = ctx.subject;
    const semester = (ctx as unknown as { semester?: string }).semester ?? "1";
    const tahunAjaran = (ctx as unknown as { academicYear?: string }).academicYear ?? "2024/2025";
    const protaData = (ctx as unknown as { protaData?: unknown }).protaData;

    const cpList = input.cp_list
      .map((cp, i) => `${i + 1}. ELEMEN: ${cp.elemen}${cp.sub_elemen ? ` / ${cp.sub_elemen}` : ""}\n   CP: ${cp.deskripsi_cp}`)
      .join("\n\n");

    const protaContext = protaData
      ? `\nData PROTA yang sudah dibuat:\n${JSON.stringify(protaData, null, 2)}`
      : "";

    return `Tugas: Susun Program Semester (PROMES) untuk ${mapel} Fase ${fase} Kelas ${kelas} Semester ${semester} Tahun Ajaran ${tahunAjaran}.${protaContext}

Capaian Pembelajaran:
${cpList}

ATURAN PROMES:
1. Minggu efektif semester: ~16-18 minggu (termasuk UTS minggu 8-9, UAS minggu 16-17)
2. UTS tipikal: minggu ke-8 atau ke-9, UAS tipikal: minggu ke-16 atau ke-17
3. Satu minggu: 1-3 TP (maks 3 untuk topik yang saling terkait)
4. TP harus dialokasikan secara SEQUENTIAL: prasyarat sebelum aplikasi
5. Topik mingguan harus SPESIFIK dan DESCRIPTIVE (bukan generik)
6. kegiatan_inti harus DESCRIPTIVE: jelaskan apa yang siswa lakukan
7. Alur mingguan harus REALISTIC
8. response_format: JSON only`;
  }
}