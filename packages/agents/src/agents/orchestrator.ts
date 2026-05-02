// Orchestrator — Sequential dispatch + SSE event emitter + checkpoint + draft reuse
// Ref: modulajar-master-v3.jsx — Orchestrator + ADR-001 + Sprint 2 Long-term Optimization
import { createAdminClient } from "@modulajar/db";
import { AI_AGENTS } from "@modulajar/shared";
import { CurriculumService } from "../lib/curriculum-service";
import { DraftService } from "../lib/draft-service";
import type {
  ModuleGenerationContext,
  CpAgentOutput,
  TpAgentOutput,
  AtpAgentOutput,
  ActivityAgentOutput,
  AsesmenAgentOutput,
  ValidatorOutput,
} from "./schemas";
import { CpAgent } from "./cp-agent";
import { TpAgent } from "./tp-agent";
import { AtpAgent } from "./atp-agent";
import { ActivityAgent } from "./activity-agent";
import { AsesmenAgent } from "./asesmen-agent";
import { ValidatorAgent } from "./validator-agent";

export interface OrchestratorEvents {
  step_start: (data: { step: number; agent: string; label: string }) => void;
  step_done: (data: { step: number; agent: string; costIdr: number; tokens: number }) => void;
  step_error: (data: { step: number; agent: string; error: string }) => void;
  progress: (data: { step: number; total: number; pct: number; message: string }) => void;
  draft_reused: (data: { step: number; agent: string; draftId: string }) => void;
  done: (data: { moduleContent: Record<string, unknown>; totalCostIdr: number; totalTokens: number; validator: ValidatorOutput; resumed: boolean }) => void;
  error: (data: { message: string }) => void;
}

export type OrchestratorEventHandler = {
  [K in keyof OrchestratorEvents]: OrchestratorEvents[K];
};

const STEP_LABELS = [
  "Membaca Capaian Pembelajaran...",
  "Menulis Tujuan Pembelajaran (ABCD)...",
  "Menyusun Alur Tujuan Pembelajaran...",
  "Mendesain kegiatan pembelajaran...",
  "Membuat instrumen asesmen...",
  "Memvalidasi hasil...",
];

const STEP_AGENTS = [
  AI_AGENTS.CP,
  AI_AGENTS.TP,
  AI_AGENTS.ATP,
  AI_AGENTS.ACTIVITY,
  AI_AGENTS.ASESMEN,
  AI_AGENTS.VALIDATOR,
] as const;

export class Orchestrator {
  private ctx: ModuleGenerationContext;
  private handlers: Partial<OrchestratorEventHandler> = {};

  constructor(ctx: ModuleGenerationContext) {
    this.ctx = ctx;
  }

  on<K extends keyof OrchestratorEventHandler>(event: K, handler: OrchestratorEventHandler[K]) {
    this.handlers[event] = handler as never;
    return this;
  }

  private emit<K extends keyof OrchestratorEventHandler>(
    event: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): void {
    this.handlers[event]?.(data);
  }

  /**
   * Load CP data — first tries CurriculumService cache (5min TTL),
   * then falls back to direct DB query.
   */
  private async loadCP(): Promise<CpAgentOutput> {
    const rawCP = await CurriculumService.getCP(this.ctx.subject, this.ctx.phase);
    // Transform to CpAgentOutput shape
    return {
      cp_list: rawCP.map((r) => ({
        elemen: r.elemen,
        sub_elemen: r.sub_elemen ?? null,
        deskripsi_cp: r.deskripsi,
      })),
      summary: `Ditemukan ${rawCP.length} elemen CP untuk ${this.ctx.subject} Fase ${this.ctx.phase}`,
    };
  }

  /**
   * Check if we can resume from an existing draft or partial job.
   * Returns existing outputs if found, null otherwise.
   */
  private async loadCheckpoint(): Promise<{
    draftId: string | null;
    cpResult: CpAgentOutput | null;
    tpResult: TpAgentOutput | null;
    atpResult: AtpAgentOutput | null;
    activityResult: ActivityAgentOutput | null;
    totalCostIdr: number;
    totalTokens: number;
  }> {
    const supabase = createAdminClient();

    // 1. Try generated_drafts table first
    try {
      const draft = await DraftService.findDraft({
        userId: this.ctx.userId,
        subject: this.ctx.subject,
        phase: this.ctx.phase,
        grade: this.ctx.grade,
        topik: this.ctx.topik,
      });

      if (draft) {
        return {
          draftId: draft.id,
          cpResult: draft.cpData ?? null,
          tpResult: draft.tpData ?? null,
          atpResult: draft.atpData ?? null,
          activityResult: draft.activityData ?? null,
          totalCostIdr: draft.costIdr ?? 0,
          totalTokens: draft.totalTokens ?? 0,
        };
      }
    } catch {
      // DraftService failed — proceed without draft
    }

    // 2. Check agent_steps for existing partial job
    const { data: existingSteps } = await supabase
      .from("agent_steps")
      .select("agent, status, output, cost_idr, tokens_used, step_order")
      .eq("job_id", this.ctx.moduleId)
      .order("step_order", { ascending: true });

    if (existingSteps && existingSteps.length > 0) {
      const doneSteps = existingSteps.filter((s) => s.status === "done");
      const lastStep = doneSteps[doneSteps.length - 1] as {
        agent: string; step_order: number;
        output: Record<string, unknown>; cost_idr: number; tokens_used: number;
      } | undefined;

      if (lastStep) {
        return {
          draftId: null,
          cpResult: doneSteps.find((s) => s.step_order === 1)?.output as CpAgentOutput ?? null,
          tpResult: doneSteps.find((s) => s.step_order === 2)?.output as TpAgentOutput ?? null,
          atpResult: doneSteps.find((s) => s.step_order === 3)?.output as AtpAgentOutput ?? null,
          activityResult: doneSteps.find((s) => s.step_order === 4)?.output as ActivityAgentOutput ?? null,
          totalCostIdr: doneSteps.reduce((sum, s) => sum + (s.cost_idr ?? 0), 0),
          totalTokens: doneSteps.reduce((sum, s) => sum + (s.tokens_used ?? 0), 0),
        };
      }
    }

    return {
      draftId: null,
      cpResult: null,
      tpResult: null,
      atpResult: null,
      activityResult: null,
      totalCostIdr: 0,
      totalTokens: 0,
    };
  }

  async run(existingJobId?: string): Promise<Record<string, unknown>> {
    const supabase = createAdminClient();
    const TOTAL_STEPS = 6;

    // ── Step 0: Load checkpoint / check for resumable draft ──────────
    const checkpoint = await this.loadCheckpoint();

    // ── Step 0b: Create or reuse job ─────────────────────────────────
    let jobId = existingJobId;
    if (!jobId) {
      const { data: job } = await supabase
        .from("agent_jobs")
        .insert({
          user_id: this.ctx.userId,
          job_type: "modul_generate",
          status: "queued",
          input: {
            subject: this.ctx.subject,
            phase: this.ctx.phase,
            grade: this.ctx.grade,
            topik: this.ctx.topik,
            duration_minutes: this.ctx.durationMinutes,
            learning_style: this.ctx.learningStyle,
          },
          module_id: this.ctx.moduleId,
          teaching_class_id: this.ctx.teachingClassId ?? null,
        })
        .select("id")
        .single();

      jobId = job?.id;
    }

    if (!jobId) throw new Error("Failed to create agent_job record");
    await supabase.from("agent_jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId);

    // ── Determine starting step based on checkpoint ───────────────────
    const startStep = checkpoint.cpResult ? (checkpoint.tpResult ? (checkpoint.atpResult ? (checkpoint.activityResult ? 5 : 4) : 3) : 2) : 1;

    // If already completed, return existing content
    if (startStep > TOTAL_STEPS - 1) {
      const { data: mod } = await supabase.from("modules").select("content").eq("id", this.ctx.moduleId).single();
      this.emit("done", {
        moduleContent: (mod?.content as Record<string, unknown>) ?? {},
        totalCostIdr: checkpoint.totalCostIdr,
        totalTokens: checkpoint.totalTokens,
        validator: { is_valid: true, score: 100, issues: [], missing_required: [], summary: "Resumed from cache" } as ValidatorOutput,
        resumed: true,
      });
      return (mod?.content as Record<string, unknown>) ?? {};
    }

    let totalCostIdr = checkpoint.totalCostIdr;
    let totalTokens = checkpoint.totalTokens;
    const plan = this.ctx.plan;

    // Track outputs for module assembly
    let cpResult: CpAgentOutput = checkpoint.cpResult ?? { cp_list: [], summary: "" };
    let tpResult: TpAgentOutput = checkpoint.tpResult ?? { tujuan_pembelajaran: [], cp_mapping: {}, jumlah_tp: 0 };
    let atpResult: AtpAgentOutput = checkpoint.atpResult ?? { alur_tp: [], total_minggu: 0, durasi_modul_menit: 0 };
    let activityResult: ActivityAgentOutput = checkpoint.activityResult ?? { atp_steps: [], total_minggu: 0, differentiations_applied: false };
    let asesmenResult: { diagnostik: unknown; formatif: unknown; sumatif: unknown } = { diagnostik: null, formatif: null, sumatif: null };

    try {
      // ── Step 1: CP Agent ─────────────────────────────────────────
      if (!checkpoint.cpResult) {
        this.emit("step_start", { step: 1, agent: AI_AGENTS.CP, label: STEP_LABELS[0] });
        this.emit("progress", { step: 1, total: TOTAL_STEPS, pct: 16, message: STEP_LABELS[0] });

        const cpAgent = new CpAgent();
        cpResult = await cpAgent.run(this.ctx, undefined, { plan });
        totalCostIdr += cpResult.costIdr;
        totalTokens += cpResult.tokens;

        await supabase.from("agent_steps").insert({
          job_id: jobId, agent: AI_AGENTS.CP, status: "done", step_order: 1,
          output: cpResult.output as unknown as Record<string, unknown>,
          cost_idr: cpResult.costIdr, tokens_used: cpResult.tokens,
          finished_at: new Date().toISOString(),
        });

        // Save to draft for future reuse (expires in 30 days)
        await DraftService.saveStep({
          userId: this.ctx.userId, subject: this.ctx.subject, phase: this.ctx.phase,
          grade: this.ctx.grade, topik: this.ctx.topik,
          step: "cp", output: cpResult.output, expiresInDays: 30,
        }).catch(() => {}); // non-blocking

        this.emit("step_done", { step: 1, agent: AI_AGENTS.CP, costIdr: cpResult.costIdr, tokens: cpResult.tokens });
        this.emit("progress", { step: 1, total: TOTAL_STEPS, pct: 30, message: STEP_LABELS[0] + " ✓" });
      } else {
        this.emit("draft_reused", { step: 1, agent: AI_AGENTS.CP, draftId: checkpoint.draftId ?? "" });
        this.emit("progress", { step: 1, total: TOTAL_STEPS, pct: 30, message: "CP ✓ (dari cache)" });
      }

      // ── Step 2: TP Agent ─────────────────────────────────────────
      if (!checkpoint.tpResult) {
        this.emit("step_start", { step: 2, agent: AI_AGENTS.TP, label: STEP_LABELS[1] });
        this.emit("progress", { step: 2, total: TOTAL_STEPS, pct: 33, message: STEP_LABELS[1] });

        const tpAgent = new TpAgent();
        tpResult = await tpAgent.run(this.ctx, cpResult, { plan });
        totalCostIdr += tpResult.costIdr;
        totalTokens += tpResult.tokens;

        await supabase.from("agent_steps").insert({
          job_id: jobId, agent: AI_AGENTS.TP, status: "done", step_order: 2,
          output: tpResult.output as unknown as Record<string, unknown>,
          cost_idr: tpResult.costIdr, tokens_used: tpResult.tokens,
          finished_at: new Date().toISOString(),
        });

        await DraftService.saveStep({
          userId: this.ctx.userId, subject: this.ctx.subject, phase: this.ctx.phase,
          grade: this.ctx.grade, topik: this.ctx.topik,
          step: "tp", output: tpResult.output, expiresInDays: 30,
        }).catch(() => {});

        this.emit("step_done", { step: 2, agent: AI_AGENTS.TP, costIdr: tpResult.costIdr, tokens: tpResult.tokens });
        this.emit("progress", { step: 2, total: TOTAL_STEPS, pct: 50, message: STEP_LABELS[1] + " ✓" });
      } else {
        tpResult = checkpoint.tpResult;
        this.emit("draft_reused", { step: 2, agent: AI_AGENTS.TP, draftId: checkpoint.draftId ?? "" });
        this.emit("progress", { step: 2, total: TOTAL_STEPS, pct: 50, message: "TP ✓ (dari cache)" });
      }

      // ── Step 3: ATP Agent ────────────────────────────────────────
      if (!checkpoint.atpResult) {
        this.emit("step_start", { step: 3, agent: AI_AGENTS.ATP, label: STEP_LABELS[2] });
        this.emit("progress", { step: 3, total: TOTAL_STEPS, pct: 55, message: STEP_LABELS[2] });

        const atpAgent = new AtpAgent();
        atpResult = await atpAgent.run(this.ctx, tpResult, { plan });
        totalCostIdr += atpResult.costIdr;
        totalTokens += atpResult.tokens;

        await supabase.from("agent_steps").insert({
          job_id: jobId, agent: AI_AGENTS.ATP, status: "done", step_order: 3,
          output: atpResult.output as unknown as Record<string, unknown>,
          cost_idr: atpResult.costIdr, tokens_used: atpResult.tokens,
          finished_at: new Date().toISOString(),
        });

        await DraftService.saveStep({
          userId: this.ctx.userId, subject: this.ctx.subject, phase: this.ctx.phase,
          grade: this.ctx.grade, topik: this.ctx.topik,
          step: "atp", output: atpResult.output, expiresInDays: 30,
        }).catch(() => {});

        this.emit("step_done", { step: 3, agent: AI_AGENTS.ATP, costIdr: atpResult.costIdr, tokens: atpResult.tokens });
        this.emit("progress", { step: 3, total: TOTAL_STEPS, pct: 65, message: STEP_LABELS[2] + " ✓" });
      } else {
        atpResult = checkpoint.atpResult;
        this.emit("draft_reused", { step: 3, agent: AI_AGENTS.ATP, draftId: checkpoint.draftId ?? "" });
        this.emit("progress", { step: 3, total: TOTAL_STEPS, pct: 65, message: "ATP ✓ (dari cache)" });
      }

      // ── Step 4: Activity Agent ────────────────────────────────────
      if (!checkpoint.activityResult) {
        this.emit("step_start", { step: 4, agent: AI_AGENTS.ACTIVITY, label: STEP_LABELS[3] });
        this.emit("progress", { step: 4, total: TOTAL_STEPS, pct: 70, message: STEP_LABELS[3] });

        const activityAgent = new ActivityAgent();
        activityResult = await activityAgent.run(this.ctx, { atp: atpResult, tp_list: tpResult }, { plan });
        totalCostIdr += activityResult.costIdr;
        totalTokens += activityResult.tokens;

        await supabase.from("agent_steps").insert({
          job_id: jobId, agent: AI_AGENTS.ACTIVITY, status: "done", step_order: 4,
          output: activityResult.output as unknown as Record<string, unknown>,
          cost_idr: activityResult.costIdr, tokens_used: activityResult.tokens,
          finished_at: new Date().toISOString(),
        });

        await DraftService.saveStep({
          userId: this.ctx.userId, subject: this.ctx.subject, phase: this.ctx.phase,
          grade: this.ctx.grade, topik: this.ctx.topik,
          step: "activity", output: activityResult.output, expiresInDays: 30,
        }).catch(() => {});

        this.emit("step_done", { step: 4, agent: AI_AGENTS.ACTIVITY, costIdr: activityResult.costIdr, tokens: activityResult.tokens });
        this.emit("progress", { step: 4, total: TOTAL_STEPS, pct: 80, message: STEP_LABELS[3] + " ✓" });
      } else {
        activityResult = checkpoint.activityResult;
        this.emit("draft_reused", { step: 4, agent: AI_AGENTS.ACTIVITY, draftId: checkpoint.draftId ?? "" });
        this.emit("progress", { step: 4, total: TOTAL_STEPS, pct: 80, message: "Activity ✓ (dari cache)" });
      }

      // ── Step 5: Asesmen Agent ─────────────────────────────────────
      this.emit("step_start", { step: 5, agent: AI_AGENTS.ASESMEN, label: STEP_LABELS[4] });
      this.emit("progress", { step: 5, total: TOTAL_STEPS, pct: 83, message: STEP_LABELS[4] });

      const asesmenAgent = new AsesmenAgent();
      const rawAsesmen = await asesmenAgent.run(this.ctx, { tp_list: tpResult, activity_output: activityResult }, { plan });
      totalCostIdr += rawAsesmen.costIdr;
      totalTokens += rawAsesmen.tokens;
      asesmenResult = rawAsesmen.output;

      await supabase.from("agent_steps").insert({
        job_id: jobId, agent: AI_AGENTS.ASESMEN, status: "done", step_order: 5,
        output: rawAsesmen.output as unknown as Record<string, unknown>,
        cost_idr: rawAsesmen.costIdr, tokens_used: rawAsesmen.tokens,
        finished_at: new Date().toISOString(),
      });

      this.emit("step_done", { step: 5, agent: AI_AGENTS.ASESMEN, costIdr: rawAsesmen.costIdr, tokens: rawAsesmen.tokens });
      this.emit("progress", { step: 5, total: TOTAL_STEPS, pct: 90, message: STEP_LABELS[4] + " ✓" });

      // ── Step 6: Validator ─────────────────────────────────────────
      this.emit("step_start", { step: 6, agent: AI_AGENTS.VALIDATOR, label: STEP_LABELS[5] });
      this.emit("progress", { step: 6, total: TOTAL_STEPS, pct: 93, message: STEP_LABELS[5] });

      const moduleContent = {
        identitas: {
          mapel: this.ctx.subject,
          fase: this.ctx.phase,
          kelas: this.ctx.grade,
          topik: this.ctx.topik,
          durasi_menit: this.ctx.durationMinutes,
          gaya_belajar: this.ctx.learningStyle,
          catatan: this.ctx.catatan,
        },
        cp_list: cpResult.cp_list,
        tujuan_pembelajaran: tpResult.tujuan_pembelajaran,
        cp_mapping: tpResult.cp_mapping,
        alur_tp: atpResult.alur_tp,
        kegiatan: activityResult.atp_steps,
        diferensiasi: activityResult.differentiations_applied,
        asesmen: {
          diagnostik: asesmenResult.diagnostik,
          formatif: asesmenResult.formatif,
          sumatif: asesmenResult.sumatif,
        },
      };

      const validatorAgent = new ValidatorAgent();
      const validatorResult = await validatorAgent.run(this.ctx, moduleContent as Parameters<typeof validatorAgent.run>[1], { plan: "plus" });
      totalCostIdr += validatorResult.costIdr;
      totalTokens += validatorResult.tokens;

      await supabase.from("agent_steps").insert({
        job_id: jobId, agent: AI_AGENTS.VALIDATOR, status: "done", step_order: 6,
        output: validatorResult.output as unknown as Record<string, unknown>,
        cost_idr: validatorResult.costIdr, tokens_used: validatorResult.tokens,
        finished_at: new Date().toISOString(),
      });

      this.emit("step_done", { step: 6, agent: AI_AGENTS.VALIDATOR, costIdr: validatorResult.costIdr, tokens: validatorResult.tokens });
      this.emit("progress", { step: 6, total: TOTAL_STEPS, pct: 98, message: STEP_LABELS[5] + " ✓" });

      // ── Finalize: Update module + job ──────────────────────────────
      await supabase
        .from("modules")
        .update({ content: moduleContent, mode: "full_ai", status: "draft", updated_at: new Date().toISOString() })
        .eq("id", this.ctx.moduleId);

      const { data: sub } = await supabase.from("subscriptions").select("ai_quota_used").eq("user_id", this.ctx.userId).single();
      if (sub) {
        await supabase.from("subscriptions").update({ ai_quota_used: (sub.ai_quota_used ?? 0) + 1 }).eq("user_id", this.ctx.userId);
      }

      await supabase.from("agent_jobs").update({
        status: "done", output: { moduleContent, validator: validatorResult.output },
        tokens_used: totalTokens, cost_idr: totalCostIdr,
        finished_at: new Date().toISOString(),
      }).eq("id", jobId);

      this.emit("done", { moduleContent, totalCostIdr, totalTokens, validator: validatorResult.output, resumed: false });

      return moduleContent;
    } catch (err) {
      const errorMsg = String(err);

      await supabase.from("agent_jobs").update({
        status: "failed", error: errorMsg, tokens_used: totalTokens, cost_idr: totalCostIdr,
        finished_at: new Date().toISOString(),
      }).eq("id", jobId);

      await supabase.from("agent_steps").insert({
        job_id: jobId, agent: "orchestrator", status: "failed",
        step_order: 99, error: errorMsg, finished_at: new Date().toISOString(),
      });

      this.emit("error", { message: errorMsg });
      throw err;
    }
  }
}
