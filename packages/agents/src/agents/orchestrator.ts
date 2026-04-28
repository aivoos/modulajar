// Orchestrator — Sequential dispatch + SSE event emitter
// Ref: modulajar-master-v3.jsx — Orchestrator + ADR-001
import { createAdminClient } from "@modulajar/db";
import { AI_AGENTS } from "@modulajar/shared";
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
  done: (data: { moduleContent: Record<string, unknown>; totalCostIdr: number; totalTokens: number; validator: ValidatorOutput }) => void;
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

  async run(existingJobId?: string): Promise<Record<string, unknown>> {
    const supabase = createAdminClient();
    const TOTAL_STEPS = 6;

    // ── Step 0: Reuse existing job or create one ─────────────────
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

    // Update to running
    await supabase.from("agent_jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId);

    let totalCostIdr = 0;
    let totalTokens = 0;
    const plan = this.ctx.plan;

    try {
      // ── Step 1: CP Agent ─────────────────────────────────────────
      this.emit("step_start", { step: 1, agent: AI_AGENTS.CP, label: STEP_LABELS[0] });
      this.emit("progress", { step: 1, total: TOTAL_STEPS, pct: 16, message: STEP_LABELS[0] });

      const cpAgent = new CpAgent();
      const cpResult = await cpAgent.run(this.ctx, undefined, { plan });
      totalCostIdr += cpResult.costIdr;
      totalTokens += cpResult.tokens;

      await supabase.from("agent_steps").insert({
        job_id: jobId,
        agent: AI_AGENTS.CP,
        status: "done",
        step_order: 1,
        output: cpResult.output as unknown as Record<string, unknown>,
        cost_idr: cpResult.costIdr,
        tokens_used: cpResult.tokens,
        finished_at: new Date().toISOString(),
      });

      this.emit("step_done", { step: 1, agent: AI_AGENTS.CP, costIdr: cpResult.costIdr, tokens: cpResult.tokens });
      this.emit("progress", { step: 1, total: TOTAL_STEPS, pct: 30, message: STEP_LABELS[0] + " ✓" });

      // ── Step 2: TP Agent ─────────────────────────────────────────
      this.emit("step_start", { step: 2, agent: AI_AGENTS.TP, label: STEP_LABELS[1] });
      this.emit("progress", { step: 2, total: TOTAL_STEPS, pct: 33, message: STEP_LABELS[1] });

      const tpAgent = new TpAgent();
      const tpResult = await tpAgent.run(this.ctx, cpResult.output, { plan });
      totalCostIdr += tpResult.costIdr;
      totalTokens += tpResult.tokens;

      await supabase.from("agent_steps").insert({
        job_id: jobId,
        agent: AI_AGENTS.TP,
        status: "done",
        step_order: 2,
        output: tpResult.output as unknown as Record<string, unknown>,
        cost_idr: tpResult.costIdr,
        tokens_used: tpResult.tokens,
        finished_at: new Date().toISOString(),
      });

      this.emit("step_done", { step: 2, agent: AI_AGENTS.TP, costIdr: tpResult.costIdr, tokens: tpResult.tokens });
      this.emit("progress", { step: 2, total: TOTAL_STEPS, pct: 50, message: STEP_LABELS[1] + " ✓" });

      // ── Step 3: ATP Agent ────────────────────────────────────────
      this.emit("step_start", { step: 3, agent: AI_AGENTS.ATP, label: STEP_LABELS[2] });
      this.emit("progress", { step: 3, total: TOTAL_STEPS, pct: 55, message: STEP_LABELS[2] });

      const atpAgent = new AtpAgent();
      const atpResult = await atpAgent.run(this.ctx, tpResult.output, { plan });
      totalCostIdr += atpResult.costIdr;
      totalTokens += atpResult.tokens;

      await supabase.from("agent_steps").insert({
        job_id: jobId,
        agent: AI_AGENTS.ATP,
        status: "done",
        step_order: 3,
        output: atpResult.output as unknown as Record<string, unknown>,
        cost_idr: atpResult.costIdr,
        tokens_used: atpResult.tokens,
        finished_at: new Date().toISOString(),
      });

      this.emit("step_done", { step: 3, agent: AI_AGENTS.ATP, costIdr: atpResult.costIdr, tokens: atpResult.tokens });
      this.emit("progress", { step: 3, total: TOTAL_STEPS, pct: 65, message: STEP_LABELS[2] + " ✓" });

      // ── Step 4: Activity Agent ───────────────────────────────────
      this.emit("step_start", { step: 4, agent: AI_AGENTS.ACTIVITY, label: STEP_LABELS[3] });
      this.emit("progress", { step: 4, total: TOTAL_STEPS, pct: 70, message: STEP_LABELS[3] });

      const activityAgent = new ActivityAgent();
      const activityResult = await activityAgent.run(this.ctx, { atp: atpResult.output, tp_list: tpResult.output }, { plan });
      totalCostIdr += activityResult.costIdr;
      totalTokens += activityResult.tokens;

      await supabase.from("agent_steps").insert({
        job_id: jobId,
        agent: AI_AGENTS.ACTIVITY,
        status: "done",
        step_order: 4,
        output: activityResult.output as unknown as Record<string, unknown>,
        cost_idr: activityResult.costIdr,
        tokens_used: activityResult.tokens,
        finished_at: new Date().toISOString(),
      });

      this.emit("step_done", { step: 4, agent: AI_AGENTS.ACTIVITY, costIdr: activityResult.costIdr, tokens: activityResult.tokens });
      this.emit("progress", { step: 4, total: TOTAL_STEPS, pct: 80, message: STEP_LABELS[3] + " ✓" });

      // ── Step 5: Asesmen Agent ─���──────────────────────────────────
      this.emit("step_start", { step: 5, agent: AI_AGENTS.ASESMEN, label: STEP_LABELS[4] });
      this.emit("progress", { step: 5, total: TOTAL_STEPS, pct: 83, message: STEP_LABELS[4] });

      const asesmenAgent = new AsesmenAgent();
      const asesmenResult = await asesmenAgent.run(this.ctx, { tp_list: tpResult.output, activity_output: activityResult.output }, { plan });
      totalCostIdr += asesmenResult.costIdr;
      totalTokens += asesmenResult.tokens;

      await supabase.from("agent_steps").insert({
        job_id: jobId,
        agent: AI_AGENTS.ASESMEN,
        status: "done",
        step_order: 5,
        output: asesmenResult.output as unknown as Record<string, unknown>,
        cost_idr: asesmenResult.costIdr,
        tokens_used: asesmenResult.tokens,
        finished_at: new Date().toISOString(),
      });

      this.emit("step_done", { step: 5, agent: AI_AGENTS.ASESMEN, costIdr: asesmenResult.costIdr, tokens: asesmenResult.tokens });
      this.emit("progress", { step: 5, total: TOTAL_STEPS, pct: 90, message: STEP_LABELS[4] + " ✓" });

      // ── Step 6: Validator ────────────────────────────────────────
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
        cp_list: cpResult.output.cp_list,
        tujuan_pembelajaran: tpResult.output.tujuan_pembelajaran,
        cp_mapping: tpResult.output.cp_mapping,
        alur_tp: atpResult.output.alur_tp,
        kegiatan: activityResult.output.atp_steps,
        diferensiasi: activityResult.output.differentiations_applied,
        asesmen: {
          diagnostik: asesmenResult.output.diagnostik,
          formatif: asesmenResult.output.formatif,
          sumatif: asesmenResult.output.sumatif,
        },
      };

      const validatorAgent = new ValidatorAgent();
      const validatorResult = await validatorAgent.run(this.ctx, moduleContent as Parameters<typeof validatorAgent.run>[1], { plan: "plus" });
      totalCostIdr += validatorResult.costIdr;
      totalTokens += validatorResult.tokens;

      await supabase.from("agent_steps").insert({
        job_id: jobId,
        agent: AI_AGENTS.VALIDATOR,
        status: "done",
        step_order: 6,
        output: validatorResult.output as unknown as Record<string, unknown>,
        cost_idr: validatorResult.costIdr,
        tokens_used: validatorResult.tokens,
        finished_at: new Date().toISOString(),
      });

      this.emit("step_done", { step: 6, agent: AI_AGENTS.VALIDATOR, costIdr: validatorResult.costIdr, tokens: validatorResult.tokens });
      this.emit("progress", { step: 6, total: TOTAL_STEPS, pct: 98, message: STEP_LABELS[5] + " ✓" });

      // ── Finalize: Update module + job ────────────────────────────
      await supabase
        .from("modules")
        .update({
          content: moduleContent,
          mode: "full_ai",
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", this.ctx.moduleId);

      // Update quota used (atomic via transaction)
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("ai_quota_used")
        .eq("user_id", this.ctx.userId)
        .single();

      if (sub) {
        await supabase
          .from("subscriptions")
          .update({ ai_quota_used: (sub.ai_quota_used ?? 0) + 1 })
          .eq("user_id", this.ctx.userId);
      }

      await supabase.from("agent_jobs").update({
        status: "done",
        output: { moduleContent, validator: validatorResult.output },
        tokens_used: totalTokens,
        cost_idr: totalCostIdr,
        finished_at: new Date().toISOString(),
      }).eq("id", jobId);

      this.emit("done", {
        moduleContent,
        totalCostIdr,
        totalTokens,
        validator: validatorResult.output,
      });

      return moduleContent;
    } catch (err) {
      const errorMsg = String(err);

      // Mark job as failed
      await supabase.from("agent_jobs").update({
        status: "failed",
        error: errorMsg,
        tokens_used: totalTokens,
        cost_idr: totalCostIdr,
        finished_at: new Date().toISOString(),
      }).eq("id", jobId);

      // Insert error step
      await supabase.from("agent_steps").insert({
        job_id: jobId,
        agent: "orchestrator",
        status: "failed",
        step_order: 99,
        error: errorMsg,
        finished_at: new Date().toISOString(),
      });

      this.emit("error", { message: errorMsg });
      throw err;
    }
  }
}