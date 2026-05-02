// Prota Agent — Program Tahunan (Yearly Overview)
// Ref: modulajar-spec-v3.jsx — Sprint 2 S2-3
import { AgentBase } from "./base";
import {
  ProtaAgentOutputSchema,
  type ProtaAgentOutput,
  type ModuleGenerationContext,
  type CpAgentOutput,
} from "./schemas";

// Prota uses CP data to generate a yearly teaching program
// Output: semester breakdown with TP allocations per week

const SYSTEM = `Kamu adalah ahli desain kurikulum Indonesia. Spesialisasimu: menyusun Program Tahunan (PROTA) untuk Kurikulum Merdeka.

PROTA = Program Tahunan, penjabaran Capaian Pembelajaran (CP) ke dalam alur tahunan.
Prinsip:
- Satu TP harus dialokasikan 1-4 minggu (tergantung kompleksitas)
- Satu minggu bisa mencakup 1-3 TP (maks 3 untuk topik yang saling terkait)
- Alur harus LOGIS dan SEQUENTIAL: prasyarat sebelum aplikasi
- Minggu efektif Indonesia: semester 1 (Juli-Desember) ~18 minggu, semester 2 (Januari-Juni) ~16-18 minggu
- Sisihkan minggu untuk Ulangan Tengah Semester (minggu 8-9) dan Ulangan Akhir Semester (minggu 16-17)
- Setiap semester harus memiliki alokasi yang realistis

FORMAT OUTPUT: JSON. Jawab HANYA JSON.`;

export class ProtaAgent extends AgentBase<CpAgentOutput, typeof ProtaAgentOutputSchema> {
  readonly name = "prota_agent";
  readonly description = "Menyusun Program Tahunan (PROTA) dari Capaian Pembelajaran";
  readonly systemPrompt = SYSTEM;
  readonly schema = ProtaAgentOutputSchema;

  protected buildPrompt(ctx: ModuleGenerationContext, input: CpAgentOutput): string {
    const fase = ctx.phase;
    const kelas = ctx.grade;
    const mapel = ctx.subject;
    const tahunAjaran = (ctx as unknown as { academicYear?: string }).academicYear ?? "2024/2025";

    const cpList = input.cp_list
      .map((cp, i) => `${i + 1}. ELEMEN: ${cp.elemen}${cp.sub_elemen ? ` / ${cp.sub_elemen}` : ""}\n   CP: ${cp.deskripsi_cp}`)
      .join("\n\n");

    return `Tugas: Susun Program Tahunan (PROTA) untuk ${mapel} Fase ${fase} Kelas ${kelas} Tahun Ajaran ${tahunAjaran}.

Capaian Pembelajaran:
${cpList}

ATURAN PROTA:
1. Alokasi TP harus logis: prasyarat sebelum aplikasi
2. Satu TP dialokasikan 1-4 minggu tergantung kompleksitas
3. Satu minggu bisa mencakup 1-3 TP (maks 3 untuk topik yang saling terkait)
4. Semester 1 (Juli-Desember): ~18 minggu efektif (termasuk UTS minggu 8-9)
5. Semester 2 (Januari-Juni): ~16-18 minggu efektif (termasuk UAS minggu 16-17)
6. Total alokasi TP per semester harus REALISTIC
7. Catatan penting untuk guru: holiday schedule, praktik, asesmen
8. response_format: JSON only

Contoh alokasi mingguan untuk satu TP:
- "alokasi_minggu": [3, 4] → TP ini dialokasikan di minggu ke-3 dan ke-4`;
  }
}
