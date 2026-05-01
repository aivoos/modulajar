// Agent routes — /api/agent/*
// Ref: modulajar-master-v3.jsx — AI Agent Layer
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { PLAN_LIMITS } from "@modulajar/shared";
import { chargeModuleGeneration, dnaGetBalance } from "../lib/dna-client";
import { getOpenAIClient } from "@modulajar/agents";
import type { ModuleGenerationContext } from "@modulajar/agents";
import { GenerateBody, AssistBody } from "../lib/schemas";

function getUserId(request: Request): string | null {
  return request.headers.get("X-User-ID") ?? null;
}

// GET /api/agent/quota — check user's AI quota
export const agentRoutes = new Elysia({ prefix: "agent" })
  .get("/quota", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, ai_quota_used, ai_quota_limit")
      .eq("user_id", userId)
      .single();

    if (!sub) {
      set.status = 404;
      return { error: "subscription_not_found", plan: "free", used: 0, limit: 0, available: 0, exhausted: true };
    }

    const limits = PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS];
    const limit = limits ? ("ai_quota_per_month" in limits ? (limits as { ai_quota_per_month: number }).ai_quota_per_month : -1) : 0;
    const used = sub.ai_quota_used ?? 0;
    const available = limit < 0 ? -1 : Math.max(0, limit - used);

    // Get DNA wallet balance for topup credits
    let dnaBalance = 0n;
    try {
      dnaBalance = await dnaGetBalance(supabase, userId);
    } catch {
      // DNA not yet initialized — skip
    }

    return {
      plan: sub.plan,
      used,
      limit,
      available,
      exhausted: available === 0,
      can_generate: true,
      can_download_pdf: sub.plan !== "free",
      dna_balance: Number(dnaBalance),
      dna_formatted: `${dnaBalance} credits remaining`,
    };
  })

  // POST /api/agent/generate — start Full AI generation
  .post("/generate", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const raw = await request.json().catch(() => ({}));
    const parsed = GenerateBody.safeParse(raw);
    if (!parsed.success) {
      set.status = 400;
      return { error: "validation_error" };
    }
    const body = parsed.data;

    // ── Fetch subscription ────────────────────────────────────────
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, plan, ai_quota_used, ai_quota_limit")
      .eq("user_id", userId)
      .single();

    if (!sub) {
      set.status = 403;
      return { error: "plan_required", upgrade_url: "/settings/billing", message: "Buat akun terlebih dahulu" };
    }

    // Free tier can generate (2/month) but cannot download PDF
    // (PDF download check is in the PDF export endpoint, not here)

    // ── DNA Wallet check (replaces old ai_quota_used counter) ──────
    // Pro/Sekolah: deduct from DNA wallet. Free: skip DNA check (uses monthly AI limit).
    const isFreeTier = sub.plan === "free";
    if (!isFreeTier) {
      const chargeResult = await chargeModuleGeneration(supabase, {
        userId,
        moduleId: body.module_id ?? "temp",
        subject: body.subject,
        phase: body.phase,
      });

      if (!chargeResult.success) {
        if (chargeResult.error === "INSUFFICIENT_BALANCE") {
          set.status = 402;
          return {
            error: "insufficient_balance",
            message: "Topup credits habis. Upgrade plan atau beli topup credits.",
            topup_url: "/settings/billing?topup=true",
            balance_formatted: `${chargeResult.balanceAfter ?? 0} credits remaining`,
            upgrade_url: "/settings/billing",
          };
        }
        if (chargeResult.error === "POLICY_LIMIT_EXCEEDED") {
          set.status = 429;
          return {
            error: "policy_limit_exceeded",
            message: "Batas harian tercapai. Coba lagi besok.",
            topup_url: "/settings/billing?topup=true",
          };
        }
        set.status = 500;
        return { error: chargeResult.error ?? "dna_charge_failed" };
      }
    }

    // ── Create or use existing module ─────────────────────────────
    let moduleId = body.module_id;

    if (!moduleId) {
      // Lookup active curriculum version
      const { data: cv } = await supabase
        .from("curriculum_versions")
        .select("id")
        .eq("status", "active")
        .limit(1)
        .single();

      // Lookup module template
      let templateId: string | null = null;
      if (cv) {
        const { data: tmpl } = await supabase
          .from("module_templates")
          .select("id")
          .eq("curriculum_version_id", cv.id)
          .limit(1)
          .single();
        templateId = tmpl?.id ?? null;
      }

      const { data: mod, error: modErr } = await supabase
        .from("modules")
        .insert({
          user_id: userId,
          title: body.topik ? `Modul AI — ${body.topik}` : `Modul AI — ${body.subject}`,
          subject: body.subject,
          phase: body.phase,
          grade: body.grade,
          duration_minutes: body.duration_minutes,
          curriculum_version_id: cv?.id ?? null,
          template_id: templateId,
          content: {},
          status: "draft",
          mode: "full_ai",
        })
        .select("id")
        .single();

      if (modErr || !mod) {
        set.status = 500;
        return { error: "module_create_failed" };
      }
      moduleId = mod.id;
    }

    // moduleId is guaranteed non-null after this point
    const resolvedModuleId = moduleId!;

    // ── Create agent job ──────────────────────────────────────────
    const { data: job, error: jobErr } = await supabase
      .from("agent_jobs")
      .insert({
        user_id: userId,
        job_type: "modul_generate",
        status: "queued",
        input: {
          subject: body.subject,
          phase: body.phase,
          grade: body.grade,
          topik: body.topik ?? "",
          duration_minutes: body.duration_minutes,
          learning_style: body.learning_style,
          catatan: body.catatan ?? "",
          curriculum_version_id: body.curriculum_version_id ?? "",
        },
        module_id: moduleId,
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      set.status = 500;
      return { error: "job_create_failed" };
    }

    // ── Dispatch orchestrator in background (non-blocking) ─────────
    // Elysia handles this synchronously for simplicity.
    // For production: use a worker queue (BullMQ / Inngest) to avoid HTTP timeout.
    dispatchGeneration(job.id, userId, sub.plan as string, resolvedModuleId, body).catch((err) => {
      console.error(`[agent] Generation job ${job.id} failed:`, err);
    });

    return {
      status: "queued",
      job_id: job.id,
      module_id: resolvedModuleId,
      redirect_url: `/modules/new/ai/generating?job_id=${job.id}&module_id=${moduleId}`,
    };
  })

  // GET /api/agent/jobs/:id — get job status + steps
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

    const { data: steps } = await supabase
      .from("agent_steps")
      .select("*")
      .eq("job_id", job.id)
      .order("step_order", { ascending: true });

    return { job, steps: steps ?? [] };
  })

  // POST /api/agent/assist — Scratch editor inline AI assist
  .post("/assist", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const raw = await request.json().catch(() => ({}));
    const parsed = AssistBody.safeParse(raw);
    if (!parsed.success) { set.status = 400; return { error: "validation_error" }; }
    const { module_id, section, mode, current_content } = parsed.data;

    // Load module + template
    const { data: mod } = await supabase
      .from("modules")
      .select("id, user_id, subject, phase, grade, title")
      .eq("id", module_id)
      .single();
    if (!mod) { set.status = 404; return { error: "module_not_found" }; }
    if (mod.user_id !== userId) { set.status = 403; return { error: "forbidden" }; }

    // Check subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, ai_quota_used, ai_quota_limit")
      .eq("user_id", userId)
      .single();
    if (sub?.plan === "free" && (sub.ai_quota_used ?? 0) >= 2) {
      set.status = 403;
      return { error: "quota_exhausted", message: "Kuota AI gratis sudah habis. Upgrade ke Go." };
    }

    const openai = getOpenAIClient();
    const modeLabels: Record<string, string> = {
      suggest: "Suggestion",
      improve: "Improvement",
      generate: "Generate",
      check: "Check",
    };
    const sectionName = section.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const systemPrompt = `Kamu adalah asisten AI untuk guru Indonesia yang membuat Modul Ajar. Gunakan bahasa Indonesia yang sopan dan profesional.`;

    const userPrompt = mode === "suggest"
      ? `Beri saran untuk section "${sectionName}" pada Modul Ajar "${mod.title}" untuk mata pelajaran ${mod.subject}, Fase ${mod.phase}${mod.grade ? `, Kelas ${mod.grade}` : ""}.\n\nFormat respons sebagai JSON dengan key "suggestion" (string). Buat saran konkret dan praktis yang sesuai dengan Kurikulum Merdeka.`
      : mode === "improve"
      ? `Tingkatkan kualitas konten berikut untuk section "${sectionName}" pada Modul Ajar "${mod.title}" untuk mata pelajaran ${mod.subject}, Fase ${mod.phase}${mod.grade ? `, Kelas ${mod.grade}` : ""}.\n\nKonten saat ini:\n${current_content ?? "(kosong)"}\n\nFormat respons sebagai JSON dengan key "improved" (string). Jaga essensi konten, perbaiki struktur, keakuratan, dan kejelasan.`
      : mode === "generate"
      ? `Buat konten untuk section "${sectionName}" pada Modul Ajar "${mod.title}" untuk mata pelajaran ${mod.subject}, Fase ${mod.phase}${mod.grade ? `, Kelas ${mod.grade}` : ""}.\n\nFormat respons sebagai JSON dengan key "generated" (string). Buat konten lengkap sesuai Kurikulum Merdeka.`
      : `Periksa dan validasi konten berikut untuk section "${sectionName}" pada Modul Ajar "${mod.title}" untuk mata pelajaran ${mod.subject}, Fase ${mod.phase}${mod.grade ? `, Kelas ${mod.grade}` : ""}.\n\nKonten:\n${current_content ?? "(kosong)"}\n\nFormat respons sebagai JSON dengan key "feedback" (string) berisi daftar pemeriksaan: kekuatan, kelemahan, dan saran perbaikan.`;

    let result = "";
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });
      result = response.choices[0]?.message?.content ?? "";
    } catch (err) {
      console.error("[agent/assist] OpenAI error:", err);
      set.status = 502;
      return { error: "ai_provider_error" };
    }

    // Parse JSON from response
    let parsedResult: Record<string, string> = {};
    try {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) parsedResult = JSON.parse(match[0]);
    } catch {
      parsedResult = { raw: result };
    }

    // Update quota
    if (sub) {
      await supabase
        .from("subscriptions")
        .update({ ai_quota_used: (sub.ai_quota_used ?? 0) + 1 })
        .eq("user_id", userId);
    }

    return {
      section,
      mode,
      result: parsedResult.suggestion ?? parsedResult.improved ?? parsedResult.generated ?? parsedResult.feedback ?? result,
      raw: result,
    };
  })

  // POST /api/agent/generate-questions — Bank Soal AI
  .post("/generate-questions", async ({ request, set }) => {
  const userId = getUserId(request);
  if (!userId) { set.status = 401; return { error: "unauthorized" }; }

  const supabase = createAdminClient();
  const raw = await request.json().catch(() => ({}));
  const { question_bank_id, tp_codes, count, type, difficulty, subject, phase } = raw as {
    question_bank_id?: string;
    tp_codes?: string[];
    count?: number;
    type?: "PG" | "isian" | "uraian" | "benar_salah";
    difficulty?: "mudah" | "sedang" | "sulit";
    subject?: string;
    phase?: string;
  };

  if (!question_bank_id) { set.status = 400; return { error: "question_bank_id required" }; }

  const actualCount = Math.min(Math.max(count ?? 10, 1), 50);
  const questionType = type ?? "PG";
  const diff = difficulty ?? "sedang";

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, ai_quota_used, ai_quota_limit")
    .eq("user_id", userId)
    .single();

  if (!sub || sub.plan === "free") {
    set.status = 403;
    return { error: "subscription_required" };
  }

  const used = sub.ai_quota_used ?? 0;
  const limit = sub.ai_quota_limit ?? 30;
  if (used >= limit) {
    set.status = 403;
    return { error: "quota_exhausted", detail: "AI quota bulan ini sudah habis." };
  }

  const typeLabel: Record<string, string> = {
    PG: "Pilihan Ganda (4 opsi A-D)",
    isian: "Isian Singkat",
    uraian: "Uraian (2-5 kalimat)",
    benar_salah: "Benar/Salah",
  };

  const prompt = `Buat ${actualCount} soal ${typeLabel[questionType] ?? questionType} tingkat ${diff} untuk ${subject || "mata pelajaran umum"}${phase ? ` (Fase ${phase})` : ""}.

TP yang dipakai: ${(tp_codes ?? []).join(", ") || "TP tidak ditentukan"}

Format JSON:
{
  "questions": [
    {
      "type": "${questionType}",
      "content": "Pertanyaan yang jelas",
      "options": ${questionType === "PG" ? '["A. ...", "B. ...", "C. ...", "D. ..."]' : "[]"},
      "answer": "jawaban benar",
      "tp_code": "${(tp_codes ?? ["TP.1"])[0]}",
      "difficulty": "${diff}"
    }
  ]
}

Catatan: Bahasa Indonesia, sesuai Kurikulum Merdeka 2022.`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env["OPENAI_API_KEY"]}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Kamu guru ahli Kurikulum Merdeka Indonesia." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!openaiRes.ok) { set.status = 500; return { error: "ai_generation_failed" }; }

  const aiResult = await openaiRes.json() as { choices?: Array<{ message?: { content?: string } }> };
  const rawContent = aiResult.choices?.[0]?.message?.content ?? "{}";
  let parsed: { questions: Array<{ type: string; content: string; options?: string[]; answer: string; tp_code?: string; difficulty?: string }> };
  try { parsed = JSON.parse(rawContent); } catch { set.status = 500; return { error: "ai_response_invalid" }; }

  const generatedQuestions = parsed.questions ?? [];
  if (generatedQuestions.length === 0) { set.status = 500; return { error: "no_questions_generated" }; }

  const questionsToInsert = generatedQuestions.map((q) => ({
    user_id: userId,
    module_id: null,
    type: q.type as "PG" | "isian" | "uraian" | "benar_salah",
    content: q.content,
    options: q.options ?? [],
    answer: q.answer,
    tp_code: q.tp_code ?? (tp_codes?.[0] ?? null),
    difficulty: diff as "mudah" | "sedang" | "sulit",
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("questions")
    .insert(questionsToInsert)
    .select("id, type, content, options, answer, tp_code, difficulty");

  if (insertError) { set.status = 500; return { error: "db_insert_failed" }; }

  await supabase.from("subscriptions").update({ ai_quota_used: used + 1 }).eq("user_id", userId);

  return { generated: inserted?.length ?? 0, questions: inserted };
});
// ─────────────────────────────────────────────────────────────────

// Background dispatcher — runs orchestrator without blocking HTTP response
async function dispatchGeneration(
  jobId: string,
  userId: string,
  plan: string,
  moduleId: string,
  body: ReturnType<typeof GenerateBody.parse>,
  existingJobId?: string
): Promise<void> {
  const { Orchestrator } = await import("@modulajar/agents");
  const supabase = createAdminClient();

  // Mark job running (or re-use existing job if passed)
  await supabase
    .from("agent_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      module_id: moduleId, // ensure module_id is set
    })
    .eq("id", jobId);

  const ctx: ModuleGenerationContext = {
    userId,
    plan,
    subject: body.subject,
    phase: body.phase,
    grade: body.grade,
    topik: body.topik ?? "",
    durationMinutes: body.duration_minutes,
    learningStyle: body.learning_style ?? "campuran",
    catatan: body.catatan,
    curriculumVersionId: body.curriculum_version_id ?? "",
    moduleId,
  };

  const orchestrator = new Orchestrator(ctx);

  orchestrator
    .on("step_start", async (data) => {
      // Log step start to agent_steps
      await supabase.from("agent_steps").upsert({
        job_id: jobId,
        agent: data.agent,
        status: "running",
        step_order: data.step,
      }).eq("job_id", jobId).eq("agent", data.agent);
    })
    .on("step_done", async (data) => {
      await supabase.from("agent_jobs").update({ status: "running" }).eq("id", jobId);
      console.log(`[agent] Step ${data.step} done: ${data.agent}, cost Rp ${data.costIdr}`);
    })
    .on("done", async (data) => {
      console.log(`[agent] Job ${jobId} done: total cost Rp ${data.totalCostIdr}, ${data.totalTokens} tokens`);

      // Update module content
      await supabase
        .from("modules")
        .update({
          content: data.moduleContent as Record<string, unknown>,
          mode: "full_ai",
          updated_at: new Date().toISOString(),
        })
        .eq("id", moduleId);

      // ai_quota_used counter is kept for FREE tier only (no DNA wallet).
      // Pro/Sekolah: DNA wallet already deducted at generation start.
      if (plan === "free") {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("ai_quota_used")
          .eq("user_id", userId)
          .single();

        if (sub) {
          await supabase
            .from("subscriptions")
            .update({ ai_quota_used: (sub.ai_quota_used ?? 0) + 1 })
            .eq("user_id", userId);
        }
      }

      await supabase.from("agent_jobs").update({
        status: "done",
        output: { moduleContent: data.moduleContent, validator: data.validator },
        tokens_used: data.totalTokens,
        cost_idr: data.totalCostIdr,
        finished_at: new Date().toISOString(),
      }).eq("id", jobId);
    })
    .on("error", async (data) => {
      console.error(`[agent] Job ${jobId} error:`, data.message);
      await supabase.from("agent_jobs").update({
        status: "failed",
        error: data.message,
        finished_at: new Date().toISOString(),
      }).eq("id", jobId);
    });

  try {
    await orchestrator.run(jobId);
  } catch (err) {
    console.error(`[agent] Orchestrator failed for job ${jobId}:`, err);
    await supabase.from("agent_jobs").update({
      status: "failed",
      error: String(err),
      finished_at: new Date().toISOString(),
    }).eq("id", jobId);
  }
}

