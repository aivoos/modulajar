// DraftService — stores and retrieves intermediate generation outputs
// Enables reuse: same (subject, phase, grade, topik) = skip CP/TP/ATP LLM calls
import { createAdminClient } from "@modulajar/db";
import crypto from "node:crypto";
import type {
  CpAgentOutput,
  TpAgentOutput,
  AtpAgentOutput,
  ActivityAgentOutput,
  AsesmenAgentOutput,
} from "../agents/schemas";

export interface DraftEntry {
  id: string;
  userId: string;
  subject: string;
  phase: string;
  grade: string;
  topikHash: string;
  cpData?: CpAgentOutput;
  tpData?: TpAgentOutput;
  atpData?: AtpAgentOutput;
  activityData?: ActivityAgentOutput;
  asesmenData?: AsesmenAgentOutput;
  totalTokens?: number;
  costIdr?: number;
  agentJobId?: string;
  moduleId?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

/** Normalize topik for consistent hashing. */
function normalizeTopik(topik: string): string {
  return topik.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Create MD5 hash of topik for draft lookup key. */
export function hashTopik(topik: string): string {
  return crypto.createHash("md5").update(normalizeTopik(topik)).digest("hex");
}

/** Singleton service for generated drafts. */
class DraftServiceClass {
  /**
   * Find an existing draft for (user, subject, phase, grade, topik).
   * Returns the draft if found and not expired.
   */
  async findDraft(params: {
    userId: string;
    subject: string;
    phase: string;
    grade: string;
    topik: string;
  }): Promise<DraftEntry | null> {
    const supabase = createAdminClient();
    const topikHash = hashTopik(params.topik);

    const { data, error } = await supabase
      .from("generated_drafts")
      .select("*")
      .eq("user_id", params.userId)
      .eq("subject", params.subject)
      .eq("phase", params.phase)
      .eq("grade", params.grade)
      .eq("topik_hash", topikHash)
      .maybeSingle();

    if (error || !data) return null;

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Draft expired — delete it
      await supabase.from("generated_drafts").delete().eq("id", data.id);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      subject: data.subject,
      phase: data.phase,
      grade: data.grade,
      topikHash: data.topik_hash,
      cpData: data.cp_data ?? undefined,
      tpData: data.tp_data ?? undefined,
      atpData: data.atp_data ?? undefined,
      activityData: data.activity_data ?? undefined,
      asesmenData: data.asesmen_data ?? undefined,
      totalTokens: data.total_tokens ?? undefined,
      costIdr: data.cost_idr ?? undefined,
      agentJobId: data.agent_job_id ?? undefined,
      moduleId: data.module_id ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      expiresAt: data.expires_at ?? undefined,
    };
  }

  /**
   * Save a single step's output to the draft.
   * Uses upsert — creates if not exists, updates if exists.
   */
  async saveStep(params: {
    userId: string;
    subject: string;
    phase: string;
    grade: string;
    topik: string;
    step: "cp" | "tp" | "atp" | "activity" | "asesmen";
    output: unknown;
    totalTokens?: number;
    costIdr?: number;
    agentJobId?: string;
    moduleId?: string;
    expiresInDays?: number;
  }): Promise<string> {
    const supabase = createAdminClient();
    const topikHash = hashTopik(params.topik);

    const columnMap: Record<string, string> = {
      cp: "cp_data",
      tp: "tp_data",
      atp: "atp_data",
      activity: "activity_data",
      asesmen: "asesmen_data",
    };

    const column = columnMap[params.step];
    const expiresAt = params.expiresInDays
      ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from("generated_drafts")
      .upsert(
        {
          user_id: params.userId,
          subject: params.subject,
          phase: params.phase,
          grade: params.grade,
          topik_hash: topikHash,
          [column]: params.output as object,
          total_tokens: params.totalTokens ?? null,
          cost_idr: params.costIdr ?? null,
          agent_job_id: params.agentJobId ?? null,
          module_id: params.moduleId ?? null,
          expires_at: expiresAt ?? null,
        },
        {
          onConflict: "user_id,subject,phase,grade,topik_hash",
        }
      )
      .select("id")
      .single();

    if (error) {
      console.error(`[DraftService] saveStep error:`, error);
      throw error;
    }

    return data?.id ?? "";
  }

  /**
   * Delete expired drafts (cleanup job — call periodically).
   */
  async cleanupExpired(): Promise<number> {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("generated_drafts")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("*", { count: "exact", head: true });

    return count ?? 0;
  }

  /**
   * Delete a specific draft.
   */
  async delete(draftId: string): Promise<void> {
    const supabase = createAdminClient();
    await supabase.from("generated_drafts").delete().eq("id", draftId);
  }
}

export const DraftService = new DraftServiceClass();