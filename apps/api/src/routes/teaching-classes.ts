// Teaching Class routes — /api/teaching-classes/*
// Ref: modulajar-master-v2.jsx — Day 11
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";

export const teachingClassRoutes = new Elysia({ prefix: "teaching-classes" })
  .get("/", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const url = new URL(request.url);
    const academicYearId = url.searchParams.get("academic_year_id");

    let q = supabase
      .from("teaching_classes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (academicYearId) q = q.eq("academic_year_id", academicYearId);

    const { data, error } = await q;
    if (error) { set.status = 500; return { error: "list_failed" }; }
    return data ?? [];
  })
  .post("/", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const body = await request.json() as Record<string, unknown>;

    const { data: user } = await supabase.from("users").select("school_id").eq("id", userId).single();

    const { data, error } = await supabase
      .from("teaching_classes")
      .insert({
        user_id: userId,
        school_id: user?.school_id ?? null,
        ...body,
        student_count: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) { set.status = 500; return { error: "create_failed" }; }
    return data;
  })
  .get("/:id", async ({ params, request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("teaching_classes")
      .select("*")
      .eq("id", params["id"])
      .single();

    if (error || !data) { set.status = 404; return { error: "not_found" }; }
    if (data.user_id !== userId) { set.status = 403; return { error: "forbidden" }; }
    return data;
  })
  .patch("/:id", async ({ params, request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("teaching_classes")
      .select("user_id")
      .eq("id", params["id"])
      .single();

    if (!existing) { set.status = 404; return { error: "not_found" }; }
    if (existing.user_id !== userId) { set.status = 403; return { error: "forbidden" }; }

    const body = await request.json() as Record<string, unknown>;
    const { data, error } = await supabase
      .from("teaching_classes")
      .update(body)
      .eq("id", params["id"])
      .select()
      .single();

    if (error) { set.status = 500; return { error: "update_failed" }; }
    return data;
  })
  .delete("/:id", async ({ params, request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("teaching_classes")
      .select("user_id")
      .eq("id", params["id"])
      .single();

    if (!existing) { set.status = 404; return { error: "not_found" }; }
    if (existing.user_id !== userId) { set.status = 403; return { error: "forbidden" }; }

    const { error } = await supabase
      .from("teaching_classes")
      .delete()
      .eq("id", params["id"]);

    if (error) { set.status = 500; return { error: "delete_failed" }; }
    return { success: true };
  });
