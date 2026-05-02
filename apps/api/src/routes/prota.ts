// Prota routes — /api/prota/*
// Ref: modulajar-spec-v3.jsx — Sprint 2 S2-3 Prota (Program Tahunan)
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { getOpenAIClient, CurriculumService } from "@modulajar/agents";
import { z } from "zod";

function getUserId(request: Request): string | null {
  return request.headers.get("X-User-ID") ?? null;
}

// ── Zod schemas ───────────────────────────────────────────────────
const GenerateProtaSchema = z.object({
  subject: z.string().min(1),
  phase: z.string().min(1),
  grade: z.string().min(1),
  academicYear: z.string().min(1),
  curriculumVersionId: z.string().optional(),
});

const UpdateProtaSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(["draft", "published"]).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

// ── Helpers ───────────────────────────────────────────────────────

async function checkFeatureFlag(supabase: ReturnType<typeof createAdminClient>, userId: string, flag: string): Promise<boolean> {
  const { data } = await supabase
    .from("feature_flags")
    .select("value")
    .eq("user_id", userId)
    .eq("flag", flag)
    .single();
  return data?.value === true;
}

    // Build the AI prompt for Prota generation
function buildProtaPrompt(opts: {
  subject: string;
  phase: string;
  grade: string;
  academicYear: string;
  cpData: Array<{ elemen: string; sub_elemen?: string; deskripsi_cp: string }>;
}): string {
  const cpList = opts.cpData
    .map((cp, i) => `${i + 1}. Elemen: ${cp.elemen}${cp.sub_elemen ? ` (Sub: ${cp.sub_elemen})` : ""}\n   CP: ${cp.deskripsi_cp}`)
    .join("\n\n");

  return `Tugas: Susun Program Tahunan (PROTA) untuk ${opts.subject} Fase ${opts.phase} Kelas ${opts.grade} tahun ajaran ${opts.academicYear}.

Capaian Pembelajaran yang harus dialokasikan:
${cpList || "(Tidak ada data CP spesifik — gunakan struktur umum untuk mata pelajaran ini)"}

PROTA = Program Tahunan, penjabaran CP/TP ke dalam alur tahunan.
Format JSON dengan struktur:

{
  "title": "Program Tahunan - ${opts.subject} - Kelas ${opts.grade} - ${opts.academicYear}",
  "tahun_ajaran": "${opts.academicYear}",
  "mapel": "${opts.subject}",
  "fase": "${opts.phase}",
  "kelas": "${opts.grade}",
  "ringkasan": "Ringkasan 1-2 kalimat tentang alur tahunan ini",
  "semester": [
    {
      "semester": 1,
      "minggu_efektif": 18,
      "alokasi_tp": [
        {
          "tp_kode": "TP-X",
          "elemen": "nama elemen",
          "alokasi_minggu": [1, 2, 3],
          "capaian_minggu": "deskripsi capaian di minggu-minggu tersebut"
        }
      ],
      "ringkasan_semester": "Ringkasan alur semester 1"
    },
    {
      "semester": 2,
      "minggu_efektif": 18,
      "alokasi_tp": [...],
      "ringkasan_semester": "Ringkasan alur semester 2"
    }
  ],
  "catatan": "Catatan penting tentang implementasi PROTA ini"
}

ATURAN:
1. Tahun ajaran Indonesia: Juli - Juni (semester 1: Juli-Desember, semester 2: Januari-Juni)
2. Minggu efektif per semester: ~16-18 minggu (termasuk minggu penilaian/ujian)
3. Alokasi TP harus logis: prasyarat sebelum aplikasi
4. Satu TP dialokasikan 1-4 minggu tergantung kompleksitas
5. Setiap semester harus memiliki alokasi yang realistis
6. response_format: JSON only`;
}

// ── Routes ─────────────────────────────────────────────────────────
export const protaRoutes = new Elysia({ prefix: "prota" })

  // GET /api/prota — list user's prota plans
  .get("/", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const url = new URL(request.url);
    const academicYear = url.searchParams.get("academic_year");

    let q = supabase
      .from("prota_plans")
      .select("id, title, subject, phase, grade, academic_year, status, generated_at, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (academicYear) q = q.eq("academic_year", academicYear);

    const { data, error } = await q;
    if (error) { set.status = 500; return { error: "fetch_failed" }; }
    return data ?? [];
  })

  // POST /api/prota/generate — generate Prota via AI agent
  .post("/generate", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const raw = await request.json().catch(() => ({}));
    const parsed = GenerateProtaSchema.safeParse(raw);
    if (!parsed.success) {
      set.status = 400;
      return { error: "validation_error", details: parsed.error.flatten() };
    }
    const { subject, phase, grade, academicYear, curriculumVersionId } = parsed.data;

    const supabase = createAdminClient();

    // Check feature flag
    const flagEnabled = await checkFeatureFlag(supabase, userId, "prota_promes");
    if (!flagEnabled) {
      set.status = 403;
      return { error: "feature_not_enabled", message: "Fitur PROTA/PROMES belum aktif untuk akun Anda." };
    }

    // Check subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, ai_quota_used, ai_quota_limit")
      .eq("user_id", userId)
      .single();

    if (!sub || sub.plan === "free") {
      set.status = 403;
      return { error: "subscription_required", message: "PROTA memerlukan langganan Go atau Plus." };
    }

    // Fetch CP data for this subject/phase (uses CurriculumService 5min cache)
    const rawCP = await CurriculumService.getCP(subject, phase);
    if (!rawCP || rawCP.length === 0) {
      set.status = 400;
      return { error: "no_cp_data", message: `Data CP untuk ${subject} Fase ${phase} tidak ditemukan.` };
    }
    // Map to shape expected by dispatch and buildProtaPrompt
    const cpData = rawCP.map((r) => ({
      elemen: r.elemen,
      sub_elemen: r.sub_elemen ?? undefined,
      deskripsi_cp: r.deskripsi,
    }));

    // Create agent job
    const { data: job, error: jobErr } = await supabase
      .from("agent_jobs")
      .insert({
        user_id: userId,
        job_type: "prota_agent",
        status: "queued",
        input: {
          subject,
          phase,
          grade,
          academic_year: academicYear,
          curriculum_version_id: curriculumVersionId ?? "",
          cp_data: cpData,
        },
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      set.status = 500;
      return { error: "job_create_failed" };
    }

    // Dispatch background generation
    dispatchProtaGeneration(job.id, userId, sub.plan as string, {
      subject, phase, grade, academicYear, curriculumVersionId, cpData,
    }).catch((err) => {
      console.error(`[prota] Generation job ${job.id} failed:`, err);
    });

    return {
      jobId: job.id,
      status: "queued",
      message: "Prota sedang dibuat. Proses biasanya memakan waktu 30-60 detik.",
    };
  })

  // GET /api/prota/jobs/:id — get generation job status
  .get("/jobs/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: job } = await supabase
      .from("agent_jobs")
      .select("*")
      .eq("id", params["id"])
      .eq("user_id", userId)
      .single();

    if (!job) { set.status = 404; return { error: "job_not_found" }; }

    return job;
  })

  // GET /api/prota/:id — get single prota plan
  .get("/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: plan } = await supabase
      .from("prota_plans")
      .select("*")
      .eq("id", params["id"])
      .eq("user_id", userId)
      .single();

    if (!plan) { set.status = 404; return { error: "prota_not_found" }; }

    return plan;
  })

  // PUT /api/prota/:id — update prota plan
  .put("/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const raw = await request.json().catch(() => ({}));
    const parsed = UpdateProtaSchema.safeParse(raw);
    if (!parsed.success) {
      set.status = 400;
      return { error: "validation_error", details: parsed.error.flatten() };
    }

    const supabase = createAdminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("prota_plans")
      .select("id, user_id")
      .eq("id", params["id"])
      .single();

    if (!existing || existing.user_id !== userId) {
      set.status = 403; return { error: "forbidden" };
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.title) updates.title = parsed.data.title;
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.content) updates.content = parsed.data.content;

    const { data, error } = await supabase
      .from("prota_plans")
      .update(updates)
      .eq("id", params["id"])
      .eq("user_id", userId)
      .select()
      .single();

    if (error) { set.status = 500; return { error: "update_failed" }; }
    return data;
  })

  // DELETE /api/prota/:id — delete prota plan
  .delete("/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("prota_plans")
      .delete()
      .eq("id", params["id"])
      .eq("user_id", userId);

    if (error) { set.status = 500; return { error: "delete_failed" }; }
    return { deleted: true };
  });

// ── Background dispatch ─────────────────────────────────────────────

interface ProtaGenerationInput {
  subject: string;
  phase: string;
  grade: string;
  academicYear: string;
  curriculumVersionId?: string;
  cpData: Array<{ elemen: string; sub_elemen?: string; deskripsi_cp: string }>;
}

// dispatchProtaGeneration reuses cpData from caller (already cached at route handler level)
async function dispatchProtaGeneration(
  jobId: string,
  userId: string,
  plan: string,
  input: ProtaGenerationInput,
): Promise<void> {
  const supabase = createAdminClient();

  // Mark job running
  await supabase.from("agent_jobs").update({
    status: "running",
    started_at: new Date().toISOString(),
  }).eq("id", jobId);

  try {
    const openai = getOpenAIClient();
    const prompt = buildProtaPrompt(input);

    const response = await openai.chat.completions.create({
      model: plan === "plus" || plan === "sekolah" ? "gpt-4o-mini" : "gpt-4o-mini",
      max_tokens: 8192,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "Kamu adalah ahli desain kurikulum Indonesia. Jawaban HANYA JSON. Tidak ada teks lain.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices[0]?.message?.content ?? "{}";
    const usage = response.usage ?? { prompt_tokens: 0, completion_tokens: 0 };

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      throw new Error(`JSON parse failed: ${String(e)}. Raw: ${rawContent.slice(0, 200)}`);
    }

    // Create prota_plan record
    const { data: planRecord, error: planErr } = await supabase
      .from("prota_plans")
      .insert({
        user_id: userId,
        title: (parsed.title as string) ?? `Program Tahunan ${input.subject} Kelas ${input.grade}`,
        subject: input.subject,
        phase: input.phase,
        grade: input.grade,
        academic_year: input.academicYear,
        curriculum_version_id: input.curriculumVersionId ?? null,
        status: "draft",
        content: parsed as Record<string, unknown>,
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (planErr || !planRecord) {
      throw new Error(`Failed to save prota plan: ${planErr?.message}`);
    }

    // Update job as done
    const costIdr = Math.round(
      (usage.prompt_tokens * 0.15 / 1000) + (usage.completion_tokens * 0.60 / 1000)
    );

    await supabase.from("agent_jobs").update({
      status: "done",
      output: { prota_plan_id: planRecord.id, content: parsed },
      tokens_used: usage.prompt_tokens + usage.completion_tokens,
      cost_idr: costIdr,
      finished_at: new Date().toISOString(),
    }).eq("id", jobId);

    console.log(`[prota] Job ${jobId} done — plan ${planRecord.id}, cost Rp ${costIdr}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[prota] Job ${jobId} failed:`, message);

    await supabase.from("agent_jobs").update({
      status: "failed",
      error: message,
      finished_at: new Date().toISOString(),
    }).eq("id", jobId);
  }
}