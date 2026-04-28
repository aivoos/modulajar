// Student routes — /api/students/*
// Ref: modulajar-master-v2.jsx — Day 12 (Import Excel)
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";

export const studentRoutes = new Elysia({ prefix: "students" })
  .get("/", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const url = new URL(request.url);
    const teachingClassId = url.searchParams.get("teaching_class_id");
    if (!teachingClassId) { set.status = 400; return { error: "teaching_class_id required" }; }

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("teaching_class_id", teachingClassId)
      .eq("is_active", true)
      .order("name");

    if (error) { set.status = 500; return { error: "list_failed" }; }
    return data ?? [];
  })
  .post("/", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const body = await request.json() as Record<string, unknown>;
    const { data, error } = await supabase
      .from("students")
      .insert({ ...body, is_active: true })
      .select()
      .single();

    if (error) { set.status = 500; return { error: "create_failed" }; }

    // Update student_count di teaching_classes
    if (body["teaching_class_id"]) {
      const { count } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("teaching_class_id", body["teaching_class_id"])
        .eq("is_active", true);
      await supabase
        .from("teaching_classes")
        .update({ student_count: count ?? 0 })
        .eq("id", body["teaching_class_id"]);
    }

    return data;
  })
  .post("/import", async ({ request, set }) => {
    // Batch import students from Excel-parsed JSON
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const body = await request.json() as {
      teaching_class_id: string;
      students: Array<{ name: string; nis?: string; gender?: string }>;
    };

    if (!body.teaching_class_id || !body.students?.length) {
      set.status = 400; return { error: "teaching_class_id and students[] required" };
    }

    // Verify class ownership
    const { data: cls } = await supabase
      .from("teaching_classes")
      .select("id")
      .eq("id", body.teaching_class_id)
      .eq("user_id", userId)
      .single();

    if (!cls) { set.status = 403; return { error: "forbidden" }; }

    const rows = body.students
      .filter((s) => s.name?.trim())
      .map((s) => ({
        teaching_class_id: body.teaching_class_id,
        name: s.name.trim(),
        nis: s.nis?.trim() || null,
        gender: s.gender?.toUpperCase() || null,
        is_active: true,
      }));

    const { data: inserted, error } = await supabase
      .from("students")
      .insert(rows)
      .select();

    if (error) { set.status = 500; return { error: "import_failed" }; }

    // Update student_count
    const { count } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("teaching_class_id", body.teaching_class_id)
      .eq("is_active", true);

    await supabase
      .from("teaching_classes")
      .update({ student_count: count ?? 0 })
      .eq("id", body.teaching_class_id);

    return { imported: inserted?.length ?? 0, students: inserted };
  })
  .patch("/:id", async ({ params, request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const body = await request.json() as Record<string, unknown>;
    const { data, error } = await supabase
      .from("students")
      .update(body)
      .eq("id", params["id"])
      .select()
      .single();

    if (error) { set.status = 500; return { error: "update_failed" }; }
    return data;
  });
