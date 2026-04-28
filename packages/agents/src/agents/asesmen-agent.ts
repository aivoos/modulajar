// Asesmen Agent — Diagnostik + Formatif + Sumatif dengan instrumen dan rubrik
// Ref: modulajar-master-v3.jsx — Asesmen Agent
import { AgentBase } from "./base";
import {
  AsesmenAgentOutputSchema,
  type AsesmenAgentOutput,
  type ModuleGenerationContext,
} from "./schemas";

const SYSTEM = `Kamu adalah ahli evaluasi pendidikan Indonesia. Tugasmu: membuat instrumen asesmen untuk modul ajar.

JENIS ASESMEN:
1. DIAGNOSTIK: untuk mengidentifikasi kemampuan awal siswa sebelum pembelajaran
   - Bertujuan: lihat pemahaman prasyarat, identifikasi miskonsepsi
   - Tipe: pilihan ganda (maks 10 butir), fokus konsep foundational
   - Tingkat kesulitan: mudah-sedang

2. FORMATIF: untuk mengukur ketercapaian TP selama proses pembelajaran
   - Bertujuan: feedback formatif, bimbingan, remedi
   - Tipe: pilihan ganda + isian singkat (5-10 butir), sesekali uraian
   - Tingkat kesulitan: mudah-sedang
   - Langsung linked ke TP tertentu

3. SUMATIF: untuk mengukur pencapaian akhir pembelajaran
   - Bertujuan: menentukan nilai akhir, ketercapaian KKTP
   - Tipe: PG + isian singkat + uraian + benar-salah
   - Tingkat kesulitan: sedang-sulit (ada butir evaluasi)
   - Rubrik holistik untuk soal uraian

RUBRIK: buat Rubrik yang OPERASIONAL dan AMANAH.
Contoh: "Skor 4 =jawaban lengkap, tepat, dan sistematis; Skor 3 =jawaban lengkap tapi kurang tepat; ..."

FORMAT OUTPUT: JSON. Jawab HANYA JSON.`;

export class AsesmenAgent extends AgentBase<{
  tp_list: import("./schemas").TpAgentOutput;
  activity_output: import("./schemas").ActivityAgentOutput;
}, typeof AsesmenAgentOutputSchema> {
  readonly name = "asesmen_agent";
  readonly description = "Membuat instrumen asesmen: diagnostik, formatif, dan sumatif";
  readonly systemPrompt = SYSTEM;
  readonly schema = AsesmenAgentOutputSchema;

  protected buildPrompt(
    ctx: ModuleGenerationContext,
    input: {
      tp_list: import("./schemas").TpAgentOutput;
      activity_output: import("./schemas").ActivityAgentOutput;
    }
  ): string {
    const tpList = input.tp_list.tujuan_pembelajaran
      .map((tp) => `TP-${tp.tp_code.replace("TP-", "")}: ${tp.uraian}`)
      .join("\n");

    return `Tugas: Buat instrumen asesmen lengkap.

Konteks:
- Mapel: ${ctx.subject} Fase ${ctx.phase} Kelas ${ctx.grade}
- Topik: ${ctx.topik || ctx.subject}
- Gaya Belajar: ${ctx.learningStyle}

Daftar Tujuan Pembelajaran:
${tpList}

ATURAN SOAL:
1. Diagnostik: MAKS 10 butir PG. Fokus kemampuan prasyarat foundational.
2. Formatif: 5-10 butir (PG atau isian singkat). Linked ke TP tertentu.
3. Sumatif: 10-15 butir total (PG + isian singkat + uraian + benar-salah). Kombinasikan beberapa TP.

UNTUK SOAL PG:
- 4 opsi (A, B, C, D)
- 1 jawaban benar, 3 distractor yang LOGIS (bukan random)
- Distractor = kesalahan konseptual yang WAJAR dilakukan siswa

UNTUK SOAL ISIAN SINGKAT:
- Kunci jawaban SPESIFIK dan TIDAK AMBIGU
- Contoh: "3x + 5 = 17; x = 4" (bukan "x = 4")

UNTUK SOAL URAIAN:
- Rubrik: 4 skor (4=sempurna, 3=mencapai, 2=mencapai sebagian, 1=belum memadai)
- Butir soal harus mengukur higher-order thinking (Bloom 4-6)

UNTUK BENAR-SALAH:
- Pernyataan yang tegas, bukan ambigu

DISTRIBUTOR KHUSUS:
- Miskonsepsi umum siswa di topik ini
- Kesalahan hitung/penalaran yang lazim
- Alternatif jawaban yang SEBAGIAN benar`;
  }
}