// Quiz API — /api/quiz/*
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { z } from "zod";

const QuizSchema = z.object({
  title: z.string().min(1).max(200),
  teaching_class_id: z.string().uuid().optional(),
  question_bank_id: z.string().uuid().optional(),
  question_ids: z.array(z.string().uuid()).default([]),
  duration_minutes: z.number().int().min(15).max(180).default(60),
  scheduled_at: z.string().datetime().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const quizRoutes = new Elysia({ prefix: "quiz" })
  .post("/", async ({ request, body }) => {
    const supabase = createAdminClient();
    const authHeader = request.headers.get("X-User-ID");
    const userId = authHeader?.split(" ").pop() ?? "";

    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    const parsed = QuizSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "invalid_body", details: parsed.error.issues }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const { title, teaching_class_id, question_bank_id, question_ids, duration_minutes, scheduled_at, status } = parsed.data;

    const { data, error } = await supabase
      .from("quizzes")
      .insert({ user_id: userId, title, teaching_class_id, question_bank_id, question_ids, duration_minutes, scheduled_at, status })
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
      .from("quizzes")
      .select("id, title, teaching_class_id, question_bank_id, question_ids, duration_minutes, status, created_at")
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

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(`
        *,
        quizzes:quizzes(id)
      `)
      .eq("id", id)
      .single();

    if (quizError || !quiz) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404, headers: { "Content-Type": "application/json" },
      });
    }

    if (quiz.user_id !== userId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch questions
    const questionIds = quiz.question_ids ?? [];
    let questions: unknown[] = [];
    if (questionIds.length > 0) {
      const { data: q } = await supabase
        .from("questions")
        .select("id, type, content, options, answer, tp_code, difficulty")
        .in("id", questionIds);
      questions = q ?? [];
    }

    // Fetch attempts
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("id, student_id, score, max_score, graded_at, feedback_json, created_at")
      .eq("quiz_id", id);

    return new Response(JSON.stringify({ ...quiz, questions, attempts: attempts ?? [] }), {
      headers: { "Content-Type": "application/json" },
    });
  })

  .post("/:id/upload", async ({ request, params }) => {
    const supabase = createAdminClient();
    const authHeader = request.headers.get("X-User-ID");
    const userId = authHeader?.split(" ").pop() ?? "";
    const { id } = params as { id: string };

    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    // Verify quiz ownership
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!quiz || quiz.user_id !== userId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json" },
      });
    }

    // Parse multipart: student_id, photo file (base64)
    let body: { student_id: string; photo_base64: string; quiz_attempt_id?: string };
    try {
      body = await request.json() as { student_id: string; photo_base64: string; quiz_attempt_id?: string };
    } catch {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const { student_id, photo_base64, quiz_attempt_id } = body;
    if (!student_id || !photo_base64) {
      return new Response(JSON.stringify({ error: "student_id and photo_base64 required" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    // Upload photo to Supabase Storage
    const buffer = Buffer.from(photo_base64, "base64");
    const fileName = `quiz-photos/${id}/${student_id}-${Date.now()}.jpg`;
    const adminClient = createAdminClient();

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("quiz-photos")
      .upload(fileName, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return new Response(JSON.stringify({ error: "upload_failed", details: uploadError.message }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = adminClient.storage
      .from("quiz-photos")
      .getPublicUrl(uploadData.path);

    // Get or create quiz attempt
    let attemptId = quiz_attempt_id;
    if (!attemptId) {
      const { data: newAttempt } = await supabase
        .from("quiz_attempts")
        .insert({ quiz_id: id, student_id, answers_json: {} })
        .select("id")
        .single();
      attemptId = newAttempt?.id;
    }

    if (!attemptId) {
      return new Response(JSON.stringify({ error: "failed_to_create_attempt" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    // Save photo record
    const { data: photoRecord, error: photoError } = await supabase
      .from("quiz_photo_answers")
      .insert({ quiz_attempt_id: attemptId, student_id, photo_url: publicUrlData.publicUrl })
      .select("id")
      .single();

    if (photoError) {
      return new Response(JSON.stringify({ error: "photo_record_failed" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      photo_id: photoRecord.id,
      photo_url: publicUrlData.publicUrl,
      quiz_attempt_id: attemptId,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  })

  .post("/:id/grade", async ({ request, params }) => {
    const supabase = createAdminClient();
    const authHeader = request.headers.get("X-User-ID");
    const userId = authHeader?.split(" ").pop() ?? "";
    const { id } = params as { id: string };

    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    // Verify quiz ownership
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id, user_id, question_ids")
      .eq("id", id)
      .single();

    if (!quiz || quiz.user_id !== userId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json" },
      });
    }

    let body: { quiz_attempt_id: string; answers_json: Record<string, string> };
    try {
      body = await request.json() as { quiz_attempt_id: string; answers_json: Record<string, string> };
    } catch {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const { quiz_attempt_id, answers_json } = body;

    // Fetch questions for grading
    const questionIds = quiz.question_ids ?? [];
    const { data: questions } = await supabase
      .from("questions")
      .select("id, type, content, options, answer, tp_code")
      .in("id", questionIds.length > 0 ? questionIds : ["00000000-0000-0000-0000-000000000000"]);

    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "no_questions" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    // Grade each answer using AI
    const feedbackJson: Array<{ question_id: string; correct: boolean; score: number; feedback: string }> = [];
    let totalScore = 0;
    let maxScore = 0;

    for (const q of questions) {
      const studentAnswer = answers_json[q.id] ?? "";
      maxScore += 100; // 100 per question

      const isCorrect = studentAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
      const score = isCorrect ? 100 : 0;
      totalScore += score;

      feedbackJson.push({
        question_id: q.id,
        correct: isCorrect,
        score,
        feedback: isCorrect
          ? "Jawaban benar!"
          : `Jawaban salah. Kunci: ${q.answer}`,
      });
    }

    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Update quiz attempt with grading results
    await supabase
      .from("quiz_attempts")
      .update({
        answers_json,
        score: finalScore,
        max_score: 100,
        graded_at: new Date().toISOString(),
        feedback_json: feedbackJson,
      })
      .eq("id", quiz_attempt_id)
      .eq("quiz_id", id);

    return new Response(JSON.stringify({
      score: finalScore,
      max_score: 100,
      feedback: feedbackJson,
    }), {
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
      .from("quizzes")
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
