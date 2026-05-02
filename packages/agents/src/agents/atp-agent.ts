// ATP Agent — Alur Tujuan Pembelajaran mingguan
// Ref: modulajar-master-v3.jsx — ATP Agent
import { AgentBase, registerAgentPrompt } from "./base";
import {
  AtpAgentOutputSchema,
  type AtpAgentOutput,
  type ModuleGenerationContext,
  type TpAgentOutput,
} from "./schemas";

const SYSTEM = `Kamu adalah ahli desain kurikulum Indonesia. Tugasmu: menyusun Alur Tujuan Pembelajaran (ATP) mingguan.

ATP = breakdown TP menjadi alur pembelajaran per minggu. Prinsip:
- Satu TP bisa dialokasikan 1-Minggu atau LEBIH (tergantung kompleksitas)
- Satu minggu bisa mencakup 1-3 TP (tergantung kedalaman)
- Alur harus LOGIS dan SEQUENTIAL: prasyarat sebelum aplikasi
- Pertimbangkan: minggu efektif per semester (~16-18 minggu untuk Kurikulum Merdeka)
- Alur harus REALISTIC: minggu efektif = jam pelajaran tersedia

FORMAT OUTPUT: JSON. Jawab HANYA JSON.`;

registerAgentPrompt("atp", SYSTEM);

export class AtpAgent extends AgentBase<TpAgentOutput, typeof AtpAgentOutputSchema> {
  readonly agentName = "atp";
  readonly description = "Menyusun Alur Tujuan Pembelajaran mingguan dari daftar TP";
  protected readonly systemPrompt = SYSTEM;
  readonly schema = AtpAgentOutputSchema;

  protected buildPrompt(ctx: ModuleGenerationContext, input: TpAgentOutput): string {
    const tpList = input.tujuan_pembelajaran
      .map((tp) => `TP-${tp.tp_code.replace("TP-", "")}: ${tp.uraian} (Elemen: ${tp.elemen}, Bloom: ${tp.bloom_level})`)
      .join("\n");

    const totalMenit = ctx.durationMinutes;
    const mingguEfektif = Math.max(1, Math.round(totalMenit / (45 * 4)));
    const topik = ctx.topik || ctx.subject;

    return `Tugas: Susun Alur Tujuan Pembelajaran (ATP) mingguan.

Konteks:
- Mapel: ${ctx.subject} Fase ${ctx.phase} Kelas ${ctx.grade}
- Topik Utama: ${topik}
- Durasi modul: ${totalMenit} menit → estimasi ${mingguEfektif} minggu efektif
- Total TP: ${input.jumlah_tp}

Daftar Tujuan Pembelajaran:
${tpList}

ATURAN ATP:
1. Minggu pertama: APERSEPSI dan PEMAHAMAN KONSEP (bukan langsung ke TP hardest)
2. Minggu akhir: REFLEKSI dan EVALUASI
3. Jika TP > minggu efektif: GABUNGKAN TP yang relevan dalam 1 minggu (maks 3 TP/minggu)
4. Jika TP < minggu efektif: ALOKASIKAN waktu lebih untuk praktik/pendalaman
5. alokasi_minggu: berapa minggu dialokasikan untuk TP ini (bisa 1, 2, atau lebih)
6. ringkasan_minggu: paragraf ringkas untuk modul ajar (1-2 kalimat per minggu)
7. Pastikan total_minggu konsisten dengan estimasi minggu efektif
8. Durasi modul (${totalMenit} menit) harus masuk akal untuk jumlah minggu yang dihasilkan

Catatan guru: ${ctx.catatan || "(tidak ada)"}`;
  }
}
