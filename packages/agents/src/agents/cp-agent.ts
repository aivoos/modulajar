// CP Agent — Capaian Pembelajaran from curriculum DB
// Ref: modulajar-master-v3.jsx — CP Agent
import { AgentBase, registerAgentPrompt } from "./base";
import {
  CpAgentOutputSchema,
  type CpAgentOutput,
  type ModuleGenerationContext,
} from "./schemas";

const SYSTEM = `Kamu adalah ahli kurikulum Indonesia. Tugasmu: MENGAMBIL data Capaian Pembelajaran (CP) dari database yang diberikan.

KENAIAN:
- Kamu TIDAK perlu generative output panjang. Kamu hanya perlu MENERJEMAHKAN data CP dari hasil query database menjadi format JSON yang rapi.
- CP Kurikulum Merdeka berasal dari dokumen BSKAP Kemendikbud.
- Satu CP terdiri dari: elemen, sub_elemen (opsional), deskripsiCP.
- Satu fase bisa punya 2-8 elemen tergantung mapel.

OUTPUT FORMAT: JSON dengan schema yang sudah ditentukan.
Jawab HANYA JSON. Tidak ada teks lain di luar JSON.`;

registerAgentPrompt("cp", SYSTEM);

export class CpAgent extends AgentBase<void, typeof CpAgentOutputSchema> {
  readonly agentName = "cp";
  readonly description = "Membaca dan menerjemahkan Capaian Pembelajaran dari database kurikulum";
  protected readonly systemPrompt = SYSTEM;
  readonly schema = CpAgentOutputSchema;

  protected buildPrompt(ctx: ModuleGenerationContext, _input: void): string {
    return `User meminta modul untuk:

Mapel: ${ctx.subject}
Fase: ${ctx.phase}
Kelas: ${ctx.grade}
Topik: ${ctx.topik || "(tidak ditentukan)"}

Tugas: Berdasarkan konteks mapel + fase + topik, BUAT daftar Capaian Pembelajaran yang RELEVAN.

Aturan:
1. Pilih elemen CP yang BENAR-BENAR relevan dengan topik yang diminta
2. Jangan masukkan semua CP fase — hanya yang sesuai topik
3. sub_elemen boleh null jika elemen tidak punya sub-elemen
4. summary: jelaskan kenapa elemen-elemen ini dipilih

Jika topik sangat spesifik (misal "persamaan linear satu variabel"), pilih MAX 2-3 elemen yang paling relevan.
Jika topik umum (misal "sistem pencernaan manusia"), pilih SEMUA elemen yang sesuai Fase ${ctx.phase}.`;
  }
}
