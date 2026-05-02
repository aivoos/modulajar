// Promes routes — /api/promes/*
// Ref: modulajar-spec-v3.jsx — Sprint 2 S2-3 Promes (Program Semester)
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { getOpenAIClient, CurriculumService } from "@modulajar/agents";
import { z } from "zod";

function getUserId(request: Request): string | null {
  return request.headers.get("X-User-ID") ?? null;
}

// ── Zod schemas ───────────────────────────────────────────────────
const GeneratePromesSchema = z.object({
  subject: z.string().min(1),
  phase: z.string().min(1),
  grade: z.string().min(1),
  semester: z.enum(["1", "2"]),
  academicYear: z.string().min(1),
  curriculumVersionId: z.string().optional(),
  protaPlanId: z.string().uuid().optional(),
});

const UpdatePromesSchema = z.object({
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

// Build the AI prompt for Promes generation
function buildPromesPrompt(opts: {
  subject: string;
  phase: string;
  grade: string;
  semester: string;
  academicYear: string;
  cpData: Array<{ elemen: string; sub_elemen?: string; deskripsi_cp: string }>;
  protaData?: Record<string, unknown>;
}): string {
  const cpList = opts.cpData
    .map((cp, i) => `${i + 1}. Elemen: ${cp.elemen}${cp.sub_elemen ? ` (Sub: ${cp.sub_elemen})` : ""}\n   CP: ${cp.deskripsi_cp}`)
    .join("\n\n");

  const protaContext = opts.protaData
    ? `\nData PROTA yang sudah dibuat:\n${JSON.stringify(opts.protaData, null, 2)}`
    : "";

  return `Tugas: Susun Program Semester (PROMES) untuk ${opts.subject} Fase ${opts.phase} Kelas ${opts.grade} Semester ${opts.semester} tahun ajaran ${opts.academicYear}.${protaContext}

Capaian Pembelajaran yang harus dialokasikan:
${cpList || "(Tidak ada data CP spesifik — gunakan struktur umum untuk mata pelajaran ini)"}

PROMES = Program Semester, penjabaran PROTA ke dalam alur semester per minggu.
Tidak semua TP dialokasikan di satu semester —Promes semester 1 hanya mencakup TP untuk semester 1.

Format JSON:

{
  "title": "Program Semester - ${opts.subject} - Kelas ${opts.grade} - Smt ${opts.semester} - ${opts.academicYear}",
  "tahun_ajaran": "${opts.academicYear}",
  "semester": ${opts.semester},
  "mapel": "${opts.subject}",
  "fase": "${opts.phase}",
  "kelas": "${opts.grade}",
  "ringkasan": "Ringkasan 1-2 kalimat tentang alur semester ini",
  "minggu_efektif": 17,
  "alur_mingguan": [
    {
      "minggu_ke": 1,
      "tp_kodes": ["TP-1"],
      "elemen": "nama elemen",
      "topik": "Judul topik/judul modul",
      "kegiatan_inti": "Deskripsi kegiatan pembelajaran utama",
      "alokasi_jam": 4,
      "capaian": "Deskripsi capaian pembelajaran minggu ini"
    }
  ],
  "penilaian": {
    "formatif": "Jadwal penilaian formatif per minggu",
    "sumatif": "Jadwal penilaian sumatif semester"
  },
  "catatan": "Catatan penting implementasi"
}

ATURAN:
1. Minggu efektif semester: ~16-18 minggu (termasuk Ulangan Tengah Semester, Ulangan Akhir Semester)
2. UTS tipikal: minggu 8-9, UAS tipikal: minggu 16-17
3. Satu minggu: 1-3 TP (maks 3 untuk topik yang saling terkait)
4. TP harus dialokasikan secara SEQUENTIAL: prasyarat sebelum aplikasi
5. Alur mingguan harus LOGIS dan REALISTIC
6. response_format: JSON only`;
}

// ── Routes ─────────────────────────────────────────────────────────
export const promesRoutes = new Elysia({ prefix: "promes" })

  // GET /api/promes — list user's promes plans
  .get("/", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const url = new URL(request.url);
    const academicYear = url.searchParams.get("academic_year");

    let q = supabase
      .from("protes_plans")
      .select("id, title, subject, phase, grade, academic_year, semester, status, prota_plan_id, generated_at, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (academicYear) q = q.eq("academic_year", academicYear);

    const { data, error } = await q;
    if (error) { set.status = 500; return { error: "fetch_failed" }; }
    return data ?? [];
  })

  // POST /api/promes/generate — generate Promes via AI agent
  .post("/generate", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const raw = await request.json().catch(() => ({}));
    const parsed = GeneratePromesSchema.safeParse(raw);
    if (!parsed.success) {
      set.status = 400;
      return { error: "validation_error", details: parsed.error.flatten() };
    }
    const { subject, phase, grade, semester, academicYear, curriculumVersionId, protaPlanId } = parsed.data;

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
      return { error: "subscription_required", message: "PROMES memerlukan langganan Go atau Plus." };
    }

    // Fetch CP data for this subject/phase (uses CurriculumService 5min cache)
    const rawCP = await CurriculumService.getCP(subject, phase);
    if (!rawCP || rawCP.length === 0) {
      set.status = 400;
      return { error: "no_cp_data", message: `Data CP untuk ${subject} Fase ${phase} tidak ditemukan.` };
    }
    const cpData = rawCP.map((r) => ({
      elemen: r.elemen,
      sub_elemen: r.sub_elemen ?? undefined,
      deskripsi_cp: r.deskripsi,
    }));

    // Fetch prota data if protaPlanId provided
    let protaData: Record<string, unknown> | undefined;
    if (protaPlanId) {
      const { data: prota } = await supabase
        .from("prota_plans")
        .select("content")
        .eq("id", protaPlanId)
        .eq("user_id", userId)
        .single();
      if (prota) {
        protaData = prota.content as Record<string, unknown>;
      }
    }

    // Create agent job
    const { data: job, error: jobErr } = await supabase
      .from("agent_jobs")
      .insert({
        user_id: userId,
        job_type: "promes_agent",
        status: "queued",
        input: {
          subject,
          phase,
          grade,
          semester,
          academic_year: academicYear,
          curriculum_version_id: curriculumVersionId ?? "",
          prota_plan_id: protaPlanId ?? "",
          cp_data: cpData,
          prota_data: protaData,
        },
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      set.status = 500;
      return { error: "job_create_failed" };
    }

    // Dispatch background generation
    dispatchPromesGeneration(job.id, userId, sub.plan as string, {
      subject, phase, grade, semester, academicYear, curriculumVersionId, cpData, protaData,
    }).catch((err) => {
      console.error(`[promes] Generation job ${job.id} failed:`, err);
    });

    return {
      jobId: job.id,
      status: "queued",
      message: "Promes sedang dibuat. Proses biasanya memakan waktu 30-60 detik.",
    };
  })

  // GET /api/promes/jobs/:id — get generation job status
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

  // GET /api/promes/:id — get single promes plan
  .get("/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: plan } = await supabase
      .from("protes_plans")
      .select("*")
      .eq("id", params["id"])
      .eq("user_id", userId)
      .single();

    if (!plan) { set.status = 404; return { error: "promes_not_found" }; }

    return plan;
  })

  // PUT /api/promes/:id — update promes plan
  .put("/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const raw = await request.json().catch(() => ({}));
    const parsed = UpdatePromesSchema.safeParse(raw);
    if (!parsed.success) {
      set.status = 400;
      return { error: "validation_error", details: parsed.error.flatten() };
    }

    const supabase = createAdminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("protes_plans")
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
      .from("protes_plans")
      .update(updates)
      .eq("id", params["id"])
      .eq("user_id", userId)
      .select()
      .single();

    if (error) { set.status = 500; return { error: "update_failed" }; }
    return data;
  })

  // DELETE /api/promes/:id — delete promes plan
  .delete("/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("protes_plans")
      .delete()
      .eq("id", params["id"])
      .eq("user_id", userId);

    if (error) { set.status = 500; return { error: "delete_failed" }; }
    return { deleted: true };
  });

// ── Background dispatch ─────────────────────────────────────────────

interface PromesGenerationInput {
  subject: string;
  phase: string;
  grade: string;
  semester: string;
  academicYear: string;
  curriculumVersionId?: string;
  cpData: Array<{ elemen: string; sub_elemen?: string; deskripsi_cp: string }>;
  protaData?: Record<string, unknown>;
}

async function dispatchPromesGeneration(
  jobId: string,
  userId: string,
  plan: string,
  input: PromesGenerationInput,
): Promise<void> {
  const supabase = createAdminClient();

  // Mark job running
  await supabase.from("agent_jobs").update({
    status: "running",
    started_at: new Date().toISOString(),
  }).eq("id", jobId);

  try {
    const openai = getOpenAIClient();
    const prompt = buildPromesPrompt(input);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    // Find protaPlanId from job input if any
    const { data: jobData } = await supabase
      .from("agent_jobs")
      .select("input")
      .eq("id", jobId)
      .single();
    const jobInput = (jobData?.input as Record<string, unknown>) ?? {};
    const protaPlanId = jobInput.prota_plan_id as string | undefined;

    // Create promes_plan record
    const { data: planRecord, error: planErr } = await supabase
      .from("protes_plans")
      .insert({
        user_id: userId,
        title: (parsed.title as string) ?? `Program Semester ${input.semester} ${input.subject} Kelas ${input.grade}`,
        subject: input.subject,
        phase: input.phase,
        grade: input.grade,
        academic_year: input.academicYear,
        semester: input.semester,
        prota_plan_id: protaPlanId || null,
        status: "draft",
        content: parsed as Record<string, unknown>,
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (planErr || !planRecord) {
      throw new Error(`Failed to save promes plan: ${planErr?.message}`);
    }

    // Update job as done
    const costIdr = Math.round(
      (usage.prompt_tokens * 0.15 / 1000) + (usage.completion_tokens * 0.60 / 1000)
    );

    await supabase.from("agent_jobs").update({
      status: "done",
      output: { promes_plan_id: planRecord.id, content: parsed },
      tokens_used: usage.prompt_tokens + usage.completion_tokens,
      cost_idr: costIdr,
      finished_at: new Date().toISOString(),
    }).eq("id", jobId);

    console.log(`[promes] Job ${jobId} done — plan ${planRecord.id}, cost Rp ${costIdr}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[promes] Job ${jobId} failed:`, message);

    await supabase.from("agent_jobs").update({
      status: "failed",
      error: message,
      finished_at: new Date().toISOString(),
    }).eq("id", jobId);
  }
}