/**
 * Student Import routes — /api/teaching-classes/:id/import
 * Accept .xlsx / .csv files, bulk insert students.
 * Ref: modulajar-master-v3.jsx — Day 12
 */
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import * as XLSX from "xlsx";

function getUserId(request: Request): string | null {
  return request.headers.get("X-User-ID") ?? null;
}

async function requireClass(
  supabase: ReturnType<typeof createAdminClient>,
  id: string,
  userId: string,
) {
  const { data } = await supabase
    .from("teaching_classes")
    .select("id, user_id, student_count")
    .eq("id", id)
    .single();

  if (!data) return { error: { status: 404, msg: "not_found" } as const };
  if (data.user_id !== userId) return { error: { status: 403, msg: "forbidden" } as const };
  return { data };
}

// ─── Parse helpers ─────────────────────────────────────────────────────────

interface RawStudentRow {
  nama?: string | number;
  NIS?: string | number;
  "Nama Lengkap"?: string | number;
  NISN?: string | number;
  JK?: string | number;
  Gender?: string | number;
  Jenis_Kelamin?: string | number;
  "Jenis Kelamin"?: string | number;
}

interface ParsedStudent {
  name: string;
  nis: string | null;
  gender: "L" | "P" | null;
}

function normalizeGender(raw: string | number | undefined): "L" | "P" | null {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  if (["L", "LAKI", "LAKI-LAKI", "MALE", "M"].includes(s)) return "L";
  if (["P", "PEREMPUAN", "FEMALE", "F"].includes(s)) return "P";
  return null;
}

function parseRows(raw: RawStudentRow[]): ParsedStudent[] {
  return raw
    .map((row) => {
      // Accept multiple column name variants
      const name = String(
        row.nama ?? row["Nama Lengkap"] ?? "",
      ).trim();
      const nis = row.NIS ?? row.NISN ?? null;
      const gender =
        normalizeGender(row.JK) ??
        normalizeGender(row.Gender) ??
        normalizeGender(row.Jenis_Kelamin) ??
        normalizeGender(row["Jenis Kelamin"]);

      if (!name) return null;
      return { name, nis: nis ? String(nis).trim() : null, gender };
    })
    .filter(Boolean) as ParsedStudent[];
}

// ─── Routes ────────────────────────────���──────────────────────────────────

export const importRoutes = new Elysia({ prefix: "teaching-classes" })

  // GET /api/teaching-classes/:id/import/template
  // Download template Excel file
  .get("/:id/import/template", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return new Response("Unauthorized", { status: 401 }); }

    const supabase = createAdminClient();
    const existing = await requireClass(supabase, params["id"], userId);
    if (existing.error) { set.status = existing.error.status; return new Response("Not found", { status: existing.error.status }); }

    // Build template workbook
    const wb = XLSX.utils.book_new();

    const templateData = [
      ["Nama Lengkap", "NIS (opsional)", "Jenis Kelamin (opsional)"],
      ["Andi Pratama", "12345", "L"],
      ["Siti Rahayu", "12346", "P"],
      ["Budi Santoso", "", ""],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Style header row
    ws["!cols"] = [
      { wch: 30 }, // Nama
      { wch: 15 }, // NIS
      { wch: 15 }, // JK
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Siswa");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="template_import_siswa.xlsx"`,
      },
    });
  })

  // POST /api/teaching-classes/:id/import
  // Upload + parse + bulk insert
  .post("/:id/import", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const existing = await requireClass(supabase, params["id"], userId);
    if (existing.error) { set.status = existing.error.status; return { error: existing.error.msg }; }

    // Parse form data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fd: any = await request.formData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = fd.get("file") as any as File | null;
    if (!file) {
      set.status = 400;
      return { error: "file_required" };
    }

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv",
    ];
    if (!allowedTypes.includes(file.type)) {
      set.status = 400;
      return { error: "invalid_file_type", allowed: [".xlsx", ".xls", ".csv"] };
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      set.status = 400;
      return { error: "file_too_large", max_mb: 5 };
    }

    // Read file
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch {
      set.status = 400;
      return { error: "file_read_failed" };
    }

    // Parse workbook
    let rawRows: RawStudentRow[];
    try {
      const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
      const firstSheet = wb.SheetNames[0];
      if (!firstSheet) { set.status = 400; return { error: "empty_sheet" }; }
      const ws = wb.Sheets[firstSheet];
      if (!ws) { set.status = 400; return { error: "empty_sheet" }; }
      rawRows = XLSX.utils.sheet_to_json<RawStudentRow>(ws);
    } catch {
      set.status = 400;
      return { error: "parse_failed", hint: " Pastikan file tidak corrupt." };
    }

    if (rawRows.length === 0) {
      set.status = 400;
      return { error: "empty_file" };
    }

    if (rawRows.length > 500) {
      set.status = 400;
      return { error: "too_many_rows", max: 500, hint: "Maksimum 500 siswa per import." };
    }

    const parsed = parseRows(rawRows);

    if (parsed.length === 0) {
      set.status = 400;
      return { error: "no_valid_rows", hint: " Pastikan kolom 'Nama Lengkap' ada dan terisi." };
    }

    // Get current max sort_order
    const { data: lastRow } = await supabase
      .from("students")
      .select("sort_order")
      .eq("teaching_class_id", params["id"])
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    let nextSort = (lastRow?.sort_order ?? 0);

    // Bulk insert
    const toInsert = parsed.map((s, i) => ({
      teaching_class_id: params["id"],
      name: s.name,
      nis: s.nis,
      gender: s.gender,
      sort_order: nextSort + i + 1,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("students")
      .insert(toInsert)
      .select("id, name, nis, gender, sort_order");

    if (insertError) {
      set.status = 500;
      return { error: "bulk_insert_failed", detail: insertError.message };
    }

    // Update student_count
    const addedCount = inserted?.length ?? 0;
    const { data: tc } = await supabase
      .from("teaching_classes")
      .select("student_count")
      .eq("id", params["id"])
      .single();

    if (tc) {
      await supabase
        .from("teaching_classes")
        .update({ student_count: (tc.student_count ?? 0) + addedCount })
        .eq("id", params["id"]);
    }

    const skipped = rawRows.length - parsed.length;

    return {
      imported: addedCount,
      total_rows: rawRows.length,
      skipped: skipped > 0 ? skipped : undefined,
      students: inserted ?? [],
      summary: `Berhasil mengimport ${addedCount} siswa${skipped > 0 ? `, ${skipped} baris di-skip` : ""}`,
    };
  });