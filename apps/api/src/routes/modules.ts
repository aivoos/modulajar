// Module routes — /api/modules/*
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";

function getUserId(request: Request): string | null {
  return request.headers.get("X-User-ID");
}

export const moduleRoutes = new Elysia({ prefix: "/api/modules" })
  .get("/", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const subject = url.searchParams.get("subject");
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

    let q = supabase
      .from("modules")
      .select("id, title, subject, fase, kelas, status, is_curated, fork_count, created_at, updated_at, published_at, tags")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") q = q.eq("status", status);
    if (subject) q = q.eq("subject", subject);

    const { data, error } = await q;
    if (error) { set.status = 500; return { error: "list_failed" }; }
    return data ?? [];
  })
  .post("/", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const body = await request.json() as Record<string, unknown>;

    const { data: user } = await supabase.from("users").select("school_id").eq("id", userId).single();

    const { data, error } = await supabase.from("modules").insert({
      user_id: userId,
      school_id: user?.school_id ?? null,
      title: (body.title as string) ?? "Modul Baru",
      subject: (body.subject as string) ?? "Bahasa Indonesia",
      fase: (body.fase as string) ?? "C",
      kelas: (body.kelas as number[]) ?? [10],
      duration_weeks: (body.duration_weeks as number) ?? 4,
      learning_style: (body.learning_style as string) ?? "campuran",
      curriculum_version_id: body.curriculum_version_id as string,
      module_template_id: body.module_template_id as string,
      content: (body.content as Record<string, unknown>) ?? {},
      status: "draft",
    }).select().single();

    if (error) { set.status = 500; return { error: "create_failed" }; }
    return data;
  })
  .get("/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data, error } = await supabase.from("modules").select("*").eq("id", params["id"]).single();

    if (error || !data) { set.status = 404; return { error: "module_not_found" }; }
    if (data.user_id !== userId && !data.is_curated) { set.status = 403; return { error: "forbidden" }; }
    return data;
  })
  .patch("/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: existing } = await supabase.from("modules").select("user_id, status").eq("id", params["id"]).single();

    if (!existing) { set.status = 404; return { error: "module_not_found" }; }
    if (existing.user_id !== userId) { set.status = 403; return { error: "forbidden" }; }
    if (existing.status !== "draft") { set.status = 400; return { error: "cannot_edit_published" }; }

    const body = await request.json() as Record<string, unknown>;
    const autosaveFields = ["title", "subject", "fase", "kelas", "duration_weeks", "learning_style", "content", "tags"];
    const updates: Record<string, unknown> = {};
    for (const field of autosaveFields) {
      if (field in body) updates[field] = body[field as keyof typeof body];
    }

    const { data, error } = await supabase.from("modules").update(updates).eq("id", params["id"]).select().single();
    if (error) { set.status = 500; return { error: "update_failed" }; }
    return data;
  })
  .post("/:id/publish", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("modules")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", params["id"])
      .eq("user_id", userId)
      .select()
      .single();

    if (error) { set.status = 500; return { error: "publish_failed" }; }
    return data;
  });