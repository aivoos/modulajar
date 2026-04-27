// Fork a module — copy to current user's account
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";

export const libraryRoutes = new Elysia({ prefix: "/api/library" })
  .get("/curated", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("modules")
      .select("id, title, subject, fase, kelas, is_curated, fork_count, tags, created_at, user_id")
      .eq("is_curated", true)
      .eq("status", "published")
      .order("fork_count", { ascending: false })
      .limit(50);

    if (error) { set.status = 500; return { error: "fetch_failed" }; }
    return { modules: data ?? [] };
  })
  .post("/fork/:moduleId", async ({ params, request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();

    // Load original module
    const { data: original, error: fetchErr } = await supabase
      .from("modules")
      .select("*")
      .eq("id", params["moduleId"])
      .single();

    if (fetchErr || !original) { set.status = 404; return { error: "module_not_found" }; }

    // Fork: copy with new user_id, reset status
    const { data: user } = await supabase.from("users").select("school_id").eq("id", userId).single();

    const { data: forked, error: forkErr } = await supabase
      .from("modules")
      .insert({
        user_id: userId,
        school_id: user?.school_id ?? null,
        curriculum_version_id: original.curriculum_version_id,
        module_template_id: original.module_template_id,
        title: `${original.title} (fork)`,
        subject: original.subject,
        fase: original.fase,
        kelas: original.kelas,
        duration_weeks: original.duration_weeks,
        learning_style: original.learning_style,
        content: original.content,
        status: "draft",
        fork_from_module_id: original.id,
      })
      .select()
      .single();

    if (forkErr) { set.status = 500; return { error: "fork_failed" }; }

    // Increment fork count on original
    await supabase
      .from("modules")
      .update({ fork_count: (original.fork_count ?? 0) + 1 })
      .eq("id", original.id);

    return { id: forked?.id, redirect_url: `/modules/${forked?.id}/edit` };
  });