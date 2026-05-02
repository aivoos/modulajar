// Activity Agent — Kegiatan pembelajaran dengan diferensiasi
// Ref: modulajar-master-v3.jsx — Activity Agent
import { AgentBase, registerAgentPrompt } from "./base";
import {
  ActivityAgentOutputSchema,
  type ActivityAgentOutput,
  type ModuleGenerationContext,
} from "./schemas";

const SYSTEM = `Kamu adalah ahli metodologi pembelajaran Indonesia. Tugasmu: Mendesain kegiatan pembelajaran untuk setiap minggu dalam ATP.

PRINSIP KEGIATAN:
- Kegiatan，分为 tiga fase: Pendahuluan (10-15%), Inti (70-80%), Penutup (10-15%)
- Pendahuluan: apersepsi, motivasi, menyampaikan tujuan
- Inti: eksplorasi, elaborasi, konfirmasi (sesuai pendekatan saintifik)
- Penutup: refleksi, rangkuman, penilaian, tindak lanjut
- Diferensiasi berdasarkan gaya belajar (visual, auditori, kinestetik, campuran)
- Setiap kegiatan HARUS konkret dan actionable — bukan template generik

DIFERENSIASI (per gaya belajar):
- Visual: diagram, warna, peta konsep, video, infografis
- Auditori: diskusi, curah pendapat, Presentasi, audio
- Kinestetik: praktik, eksperimen, role-play, proyek, simulasi
- Campuran: kombinasi ketiga gaya

FORMAT OUTPUT: JSON. Jawab HANYA JSON.`;

registerAgentPrompt("activity", SYSTEM);

export class ActivityAgent extends AgentBase<{
  atp: import("./schemas").AtpAgentOutput;
  tp_list: import("./schemas").TpAgentOutput;
}, typeof ActivityAgentOutputSchema> {
  readonly agentName = "activity";
  readonly description = "Mendesain kegiatan pembelajaran dengan diferensiasi gaya belajar";
  protected readonly systemPrompt = SYSTEM;
  readonly schema = ActivityAgentOutputSchema;

  protected buildPrompt(
    ctx: ModuleGenerationContext,
    input: {
      atp: import("./schemas").AtpAgentOutput;
      tp_list: import("./schemas").TpAgentOutput;
    }
  ): string {
    const gaya = ctx.learningStyle;
    const fase = ctx.phase;
    const kelas = ctx.grade;
    const mapel = ctx.subject;
    const topik = ctx.topik || ctx.subject;

    const atpSteps = input.atp.alur_tp
      .map(
        (s) =>
          `Minggu ${s.minggu_ke} (${s.tp_codes.join(", ")}): ${s.ringkasan_minggu}`
      )
      .join("\n");

    const tpList = input.tp_list.tujuan_pembelajaran
      .map((tp) => `TP-${tp.tp_code.replace("TP-", "")}: ${tp.uraian}`)
      .join("\n");

    return `Tugas: Desain kegiatan pembelajaran per minggu.

Konteks:
- Mapel: ${mapel} Fase ${fase} Kelas ${kelas}
- Topik: ${topik}
- Gaya Belajar Siswa: ${gaya}
- Catatan Guru: ${ctx.catatan || "(tidak ada)"}

Daftar Tujuan Pembelajaran:
${tpList}

Alur TP Mingguan:
${atpSteps}

ATURAN:
1. Buat SATU entry di atp_steps untuk SETIAP minggu di ATP
2. activities: array 3 kegiatan (pendahuluan, inti, penutup)
3. durasi_menit: proporsional (inti paling lama)
4. kegiatan_guru dan kegiatan_siswa: AKTIFITAS SPESIFIK, bukan template
   Contoh BENAR: "Guru menampilkan video percobaan osmosis pada kentang selama 3 menit"
   Contoh SALAH: "Guru menjelaskan materi menggunakan media"
5. differentiations: modifikasi kegiatan untuk setiap gaya belajar
   Jika gaya belajar="campuran", tulis SEMUA 3 diferensiasi
6. asesmen_formatif: minimal 3 butir soal pilihan ganda atau isian singkat
7. Media harus RELEVAN dan MUDAH DIDAPATKAN (bukan yang sulit)
8. Pertimbangkan fase ${fase}: kegiatan harus sesuai developmental level siswa kelas ${kelas}`;
  }
}
