// Zod schemas for API request validation
import { z } from "zod";

// ── Module schemas ───────────────────────────────────────────────
export const CreateModuleBody = z.object({
  title: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).optional(),
  fase: z.string().min(1).optional(),
  kelas: z.array(z.number().int().min(1).max(12)).optional(),
  duration_weeks: z.number().int().min(1).max(52).optional(),
  learning_style: z.enum(["visual", "auditori", "kinestetik", "campuran"]).optional(),
  curriculum_version_id: z.string().uuid().min(1),
  module_template_id: z.string().uuid().min(1),
  content: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateModuleBody = z.object({
  title: z.string().min(1).max(255).optional(),
  subject: z.string().optional(),
  fase: z.string().optional(),
  kelas: z.array(z.number().int().min(1).max(12)).optional(),
  duration_weeks: z.number().int().min(1).max(52).optional(),
  learning_style: z.enum(["visual", "auditori", "kinestetik", "campuran"]).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

// ── Subscription schemas ─────────────────────────────────────────
export const UpgradeBody = z.object({
  plan: z.enum(["guru_pro", "sekolah"]),
});

// ── AI Agent schemas ─────────────────────────────────────────────
export const GenerateBody = z.object({
  subject: z.string().min(1),
  fase: z.string().min(1),
  kelas: z.array(z.number().int().min(1).max(12)),
  topik: z.string().optional(),
  duration_weeks: z.number().int().min(1).max(52).optional(),
  learning_style: z.enum(["visual", "auditori", "kinestetik", "campuran"]).optional(),
  catatan: z.string().optional(),
  curriculum_version_id: z.string().uuid().optional(),
});

// ── Xendit webhook schema ────────────────────────────────────────
export const XenditWebhookPayload = z.object({
  id: z.string().min(1),
  event: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
});

// ── Error response ─────────────────���────────────────────────────
export const ErrorResponse = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export type CreateModuleInput = z.infer<typeof CreateModuleBody>;
export type UpdateModuleInput = z.infer<typeof UpdateModuleBody>;
export type GenerateInput = z.infer<typeof GenerateBody>;
export type UpgradeInput = z.infer<typeof UpgradeBody>;
export type XenditPayload = z.infer<typeof XenditWebhookPayload>;