// Bank Soal API — /api/bank-soal/*
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { z } from "zod";

const BankSoalSchema = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().default(""),
  phase: z.enum(["A", "B", "C", "D", "E", "F"]).optional(),
  tp_codes: z.array(z.string()).default([]),
  description: z.string().optional(),
});

export const bankSoalRoutes = new Elysia({ prefix: "bank-soal" })
  .post("/", async ({ request, body }) => {
    const supabase = createAdminClient();
    const authHeader = request.headers.get("X-User-ID");
    const userId = authHeader?.split(" ").pop() ?? "";

    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    const parsed = BankSoalSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "invalid_body", details: parsed.error.errors }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const { title, subject, phase, tp_codes, description } = parsed.data;

    const { data, error } = await supabase
      .from("question_banks")
      .insert({ user_id: userId, title, subject, phase, tp_codes, description })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  })

  .get("/", async ({ request }) => {
    const supabase = createAdminClient();
    const authHeader = request.headers.get("X-User-ID");
    const userId = authHeader?.split(" ").pop() ?? "";

    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("question_banks")
      .select("id, title, subject, phase, tp_codes, question_count, is_public, fork_count, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  })

  .get("/:id", async ({ request, params }) => {
    const supabase = createAdminClient();
    const authHeader = request.headers.get("X-User-ID");
    const userId = authHeader?.split(" ").pop() ?? "";
    const { id } = params as { id: string };

    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    const { data: bank, error: bankError } = await supabase
      .from("question_banks")
      .select("*")
      .eq("id", id)
      .single();

    if (bankError || !bank) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404, headers: { "Content-Type": "application/json" },
      });
    }

    if (bank.user_id !== userId && !bank.is_public) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json" },
      });
    }

    const { data: questions } = await supabase
      .from("questions")
      .select("id, type, content, options, answer, tp_code, difficulty")
      .eq("user_id", userId)
      .in("id", bank.question_count > 0 ? [] : [])
      .order("created_at");

    return new Response(JSON.stringify({ ...bank, questions: questions ?? [] }), {
      headers: { "Content-Type": "application/json" },
    });
  })

  .delete("/:id", async ({ request, params }) => {
    const supabase = createAdminClient();
    const authHeader = request.headers.get("X-User-ID");
    const userId = authHeader?.split(" ").pop() ?? "";
    const { id } = params as { id: string };

    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("question_banks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  });
