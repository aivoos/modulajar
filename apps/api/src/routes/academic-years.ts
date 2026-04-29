// Academic Year routes — /api/academic-years/*
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { CreateAcademicYearBody } from "../lib/schemas";

export const academicYearRoutes = new Elysia({ prefix: "academic-years" })
  .get("/", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("academic_years")
      .select("*")
      .order("year_start", { ascending: false });

    if (error) { set.status = 500; return { error: "fetch_failed" }; }
    return data ?? [];
  })
  .get("/active", async ({ set }) => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("academic_years")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error || !data) { set.status = 404; return { error: "no_active_year" }; }
    return data;
  })
  .post("/", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const raw = await request.json();
    const parsed = CreateAcademicYearBody.safeParse(raw);
    if (!parsed.success) { set.status = 400; return { error: "validation_error", details: parsed.error.flatten() }; }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("academic_years")
      .insert(parsed.data)
      .select()
      .single();

    if (error) { set.status = 500; return { error: "create_failed" }; }
    return data;
  })
  .patch("/:id", async ({ params, request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const raw = await request.json();
    const { error: zodErr } = CreateAcademicYearBody.partial().safeParse(raw);
    if (zodErr) { set.status = 400; return { error: "validation_error" }; }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("academic_years")
      .update(raw as Record<string, unknown>)
      .eq("id", params["id"])
      .select()
      .single();

    if (error) { set.status = 500; return { error: "update_failed" }; }
    return data;
  });
