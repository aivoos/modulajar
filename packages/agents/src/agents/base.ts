// Agent base class — extends Zod-parsed agent outputs
// Ref: modulajar-master-v3.jsx — packages/agents
import { z } from "zod";
import { getOpenAIClient } from "../providers/openai";
import type { ModuleGenerationContext } from "./schemas";

// ── Model tier: all tiers use gpt-4o-mini
// gpt-4o-mini cukup untuk modul ajar Kurikulum Merdeka (cukup straightforward)
// gpt-4o / gpt-4o-turbo reserved untuk future premium features

export const PLAN_MODEL_TIER = {
  free:    null,
  go:      "gpt-4o-mini",
  plus:    "gpt-4o-mini",
  sekolah: "gpt-4o-mini",
} as const;

export function getModelForPlan(plan: string): string {
  return PLAN_MODEL_TIER[plan as keyof typeof PLAN_MODEL_TIER] ?? "gpt-4o-mini";
}

const MODEL_COST: Record<string, { inputIdrPer1K: number; outputIdrPer1K: number }> = {
  "gpt-4o-mini":   { inputIdrPer1K: 0.15,  outputIdrPer1K: 0.60  },
};

function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const tier = MODEL_COST[model] ?? MODEL_COST["gpt-4o-mini"]!;
  return Math.round(
    (promptTokens * tier.inputIdrPer1K / 1000) +
    (completionTokens * tier.outputIdrPer1K / 1000)
  );
}

// ── Rate limiting per tier ─────────────────────────────────────────
// Enforced in API layer before dispatching to agents
// ref: modulajar-master-v3.jsx — AI quota check MUST be atomic

export const TIER_RATE_LIMITS = {
  free:    { monthly_quota: 2,  concurrent: 1, rpm: 3,  topup: false, can_generate: true,  can_download_pdf: false },
  go:      { monthly_quota: 10, concurrent: 1, rpm: 5,  topup: true,  can_generate: true,  can_download_pdf: true  },
  plus:    { monthly_quota: 20, concurrent: 2, rpm: 10, topup: true,  can_generate: true,  can_download_pdf: true  },
  sekolah: { monthly_quota: 25, concurrent: 3, rpm: 15, topup: true,  can_generate: true,  can_download_pdf: true  },
} as const;

export class RateLimitError extends Error {
  constructor(
    public readonly code: "quota_exceeded" | "concurrent_exceeded" | "rate_exceeded",
    public readonly plan: string,
    public readonly message: string
  ) { super(message); }
}

/** In-memory rate limiter. For production use Redis (Upstash). */
class TierRateLimiter {
  private concurrent = new Map<string, number>();
  private lastMinute = new Map<string, number[]>();

  check(plan: string, userId: string): void {
    const limits = TIER_RATE_LIMITS[plan as keyof typeof TIER_RATE_LIMITS];
    if (!limits) return; // unknown plan — skip

    // Check concurrent
    const current = this.concurrent.get(userId) ?? 0;
    if (current >= limits.concurrent) {
      throw new RateLimitError("concurrent_exceeded", plan,
        `Max ${limits.concurrent} generation simultaneously. Selesaikan yang sedang berjalan.`);
    }

    // Check RPM
    const now = Date.now();
    const window = limits.rpm;
    const timestamps = this.lastMinute.get(userId) ?? [];
    const recent = timestamps.filter(t => now - t < 60_000);
    if (recent.length >= window) {
      const retryAfter = Math.ceil(((recent[0] ?? now) + 60_000 - now) / 1000);
      throw new RateLimitError("rate_exceeded", plan,
        `Terlalu banyak request. Coba lagi dalam ${retryAfter} detik.`);
    }

    // Record
    this.concurrent.set(userId, current + 1);
    recent.push(now);
    this.lastMinute.set(userId, recent);
  }

  release(userId: string): void {
    const current = this.concurrent.get(userId) ?? 0;
    this.concurrent.set(userId, Math.max(0, current - 1));
  }

  /** Monthly quota check — called before dispatching generation.
   *  Pass actual DB quota values for production accuracy. */
  checkMonthlyQuota(plan: string, used: number): void {
    const limits = TIER_RATE_LIMITS[plan as keyof typeof TIER_RATE_LIMITS];
    if (!limits || limits.monthly_quota <= 0) return;
    if (used >= limits.monthly_quota) {
      throw new RateLimitError("quota_exceeded", plan,
        "Kuota Full AI bulan ini sudah habis. Upgrade ke Plus untuk unlimited.");
    }
  }
}

export const rateLimiter = new TierRateLimiter();

export abstract class AgentBase<Input, Output extends z.ZodType> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly systemPrompt: string;
  abstract readonly schema: Output;
  /** Default model. Override per-plan in subclasses if needed. */
  protected readonly model: string = "gpt-4o-mini";

  protected abstract buildPrompt(ctx: ModuleGenerationContext, input: Input): string;

  async run(
    ctx: ModuleGenerationContext,
    input: Input,
    opts?: { plan?: string; temperature?: number }
  ): Promise<{ output: z.infer<Output>; tokens: number; costIdr: number }> {
    rateLimiter.check(opts?.plan ?? ctx.plan, ctx.userId);

    try {
      const client = getOpenAIClient();
      const model = opts?.plan ? getModelForPlan(opts.plan) : this.model;
      const prompt = this.buildPrompt(ctx, input);
      const maxTokens = 4096;
      const temperature = opts?.temperature ?? 0.7;

      const response = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0]?.message?.content ?? "";
      const usage = response.usage;
      const promptTokens = usage?.prompt_tokens ?? 0;
      const completionTokens = usage?.completion_tokens ?? 0;
      const costIdr = calculateCost(model, promptTokens, completionTokens);

      let parsed: z.infer<Output>;
      try {
        const json = JSON.parse(raw);
        parsed = this.schema.parse(json);
      } catch (e) {
        console.error(`[${this.name}] Parse error:\nRaw: ${raw.slice(0, 300)}`);
        throw new Error(`${this.name} failed to parse output: ${String(e)}`);
      }

      return {
        output: parsed,
        tokens: promptTokens + completionTokens,
        costIdr,
      };
    } finally {
      rateLimiter.release(ctx.userId);
    }
  }
}
